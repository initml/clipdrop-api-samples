package co.clipdrop

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.drawable.BitmapDrawable
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.text.Editable
import android.text.TextWatcher
import android.util.DisplayMetrics
import android.util.Log
import android.util.Pair
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.Button
import android.widget.PopupMenu
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.content.res.ResourcesCompat
import androidx.lifecycle.lifecycleScope
import androidx.palette.graphics.Palette
import co.clipdrop.textdetector.TextGraphic
import co.clipdrop.textdetector.TextRecognitionProcessor
import com.clipdrop.mlvisonxclipdrop.BuildConfig
import com.clipdrop.mlvisonxclipdrop.R
import com.google.android.gms.common.annotation.KeepName
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.textfield.TextInputEditText
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.android.synthetic.main.activity_still_image.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.util.concurrent.TimeUnit


/** Activity demonstrating different image detector features with a still image from camera.  */
@KeepName
class StillImageActivity : AppCompatActivity() {
    private var currentColor: Int = 0
    private var palette: Palette? = null
    private var graphicOverlay: GraphicOverlay? = null
    private var selectedMode =
        TEXT_RECOGNITION_LATIN
    private var selectedSize: String? =
        SIZE_SCREEN
    private var isLandScape = false
    private var imageUri: Uri? = null

    // Max width (portrait mode)
    private var imageMaxWidth = 0

    // Max height (portrait mode)
    private var imageMaxHeight = 0
    private var imageProcessor: VisionImageProcessor? = null
    private var chipGroup: ChipGroup? = null
    private var confirmText: Button? = null
    private var textArea: TextInputEditText? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(com.clipdrop.mlvisonxclipdrop.R.layout.activity_still_image)
        findViewById<View>(com.clipdrop.mlvisonxclipdrop.R.id.select_image_button)
            .setOnClickListener { view: View ->
                // Menu for selecting either: a) take new photo b) select from existing
                val popup =
                    PopupMenu(this@StillImageActivity, view)
                popup.setOnMenuItemClickListener { menuItem: MenuItem ->
                    val itemId =
                        menuItem.itemId
                    if (itemId == com.clipdrop.mlvisonxclipdrop.R.id.select_images_from_local) {
                        startChooseImageIntentForResult()
                        return@setOnMenuItemClickListener true
                    } else if (itemId == com.clipdrop.mlvisonxclipdrop.R.id.take_photo_using_camera) {
                        startCameraIntentForResult()
                        return@setOnMenuItemClickListener true
                    }
                    false
                }
                val inflater = popup.menuInflater
                inflater.inflate(
                    com.clipdrop.mlvisonxclipdrop.R.menu.camera_button_menu,
                    popup.menu
                )
                popup.show()
            }
        graphicOverlay = findViewById(com.clipdrop.mlvisonxclipdrop.R.id.graphic_overlay)

        val d = ResourcesCompat.getDrawable(resources, R.mipmap.ic_launcher_foreground, null)!!
        val bitmap: Bitmap = if (d is BitmapDrawable) {
            (d as? BitmapDrawable)?.bitmap!!
        } else {
            val bitmap = Bitmap.createBitmap(
                d.intrinsicWidth,
                d.intrinsicHeight,
                Bitmap.Config.ARGB_8888
            )
            val canvas = Canvas(bitmap)
            d.setBounds(0, 0, canvas.getWidth(), canvas.getHeight())
            d.draw(canvas)
            bitmap
        }

        val displayMetrics = DisplayMetrics()
        windowManager.defaultDisplay.getMetrics(displayMetrics)
        graphicOverlay?.updateLogo(bitmap, displayMetrics.widthPixels)

        confirmText = findViewById(com.clipdrop.mlvisonxclipdrop.R.id.confirm_button)
        textArea = findViewById(com.clipdrop.mlvisonxclipdrop.R.id.text_area)

        findViewById<Button>(com.clipdrop.mlvisonxclipdrop.R.id.change_color).setOnClickListener {
            palette?.run {
                val max = swatches.size - 1
                val random = (0..max).random()
                currentColor = swatches[random].rgb
                textArea?.setTextColor(currentColor)
                graphicOverlay?.textColor = currentColor
            }
        }

        textArea?.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable) {
                graphicOverlay?.text = s.toString()
            }

            override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {}
        })



        confirmText?.setOnClickListener {
            confirmText?.visibility = View.GONE
            chipGroup?.visibility = View.GONE

            findViewById<View>(R.id.progress_circular).visibility = View.VISIBLE
            graphicOverlay?.isTextSelected = true

            lifecycleScope.launch {
                val bitmap1 = async {
                    val bitmapScaled = Bitmap.createScaledBitmap(
                        graphicOverlay?.bitmap!!,
                        graphicOverlay?.bitmap!!.width / 2,
                        graphicOverlay?.bitmap!!.height / 2, false
                    )
                    val stream = ByteArrayOutputStream()
                    bitmapScaled?.compress(Bitmap.CompressFormat.JPEG, 100, stream)
                    stream.toByteArray()
                }

                val bitmap2 = async {
                    val bitmapScaled = Bitmap.createScaledBitmap(
                        graphicOverlay?.exportMask!!,
                        graphicOverlay?.exportMask!!.width / 2,
                        graphicOverlay?.exportMask!!.height / 2, false
                    )
                    val maskStream = ByteArrayOutputStream()
                    bitmapScaled?.compress(Bitmap.CompressFormat.JPEG, 100, maskStream)
                    maskStream.toByteArray()
                }

                launch {
                    clipApiProcess(
                        bitmap1.await(),
                        bitmap2.await(),
                        object : BitmapListener {
                            override fun onBitmapReceived(bitmap: Bitmap) {
                                findViewById<View>(R.id.textSelection).visibility = View.VISIBLE
                                graphicOverlay?.updateBitmap(
                                    Bitmap.createScaledBitmap(
                                        bitmap,
                                        bitmap.width * 2,
                                        bitmap.height * 2, false
                                    )
                                )
                                findViewById<View>(R.id.progress_circular).visibility = View.GONE
                                findViewById<View>(R.id.text_input).visibility = View.VISIBLE
                            }
                        })
                }

                launch {
                    palette = Palette.from(graphicOverlay?.exportRec!!).generate()
                    val color = if (palette?.vibrantSwatch != null) {
                        palette?.vibrantSwatch
                    } else if (palette?.mutedSwatch != null) {
                        palette?.mutedSwatch
                    } else {
                        palette?.dominantSwatch
                    }

                    currentColor = color?.rgb!!
                    textArea?.setTextColor(currentColor)
                    graphicOverlay?.textColor = currentColor
                }

            }
        }

//    populateFeatureSelector()
//    populateSizeSelector()
        isLandScape =
            resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
        if (savedInstanceState != null) {
            imageUri =
                savedInstanceState.getParcelable(KEY_IMAGE_URI)
            imageMaxWidth =
                savedInstanceState.getInt(KEY_IMAGE_MAX_WIDTH)
            imageMaxHeight =
                savedInstanceState.getInt(KEY_IMAGE_MAX_HEIGHT)
            selectedSize =
                savedInstanceState.getString(KEY_SELECTED_SIZE)
        }

        val rootView = findViewById<View>(R.id.root)
        rootView.viewTreeObserver.addOnGlobalLayoutListener(
            object : ViewTreeObserver.OnGlobalLayoutListener {
                override fun onGlobalLayout() {
                    rootView.viewTreeObserver.removeOnGlobalLayoutListener(this)
                    imageMaxWidth = rootView.width
                    imageMaxHeight =
                        rootView.height - findViewById<View>(R.id.control).height
                    chipGroup = findViewById(R.id.chipGroup)
                    if (SIZE_SCREEN == selectedSize) {
                        tryReloadAndDetectInImage()
                    }
                }
            })
    }

    private fun clipApiProcess(
        streamArray: ByteArray,
        maskArray: ByteArray,
        bitmapListener: BitmapListener
    ) =
        CoroutineScope(Dispatchers.Default).launch {

            val client = OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .writeTimeout(15, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();

            val requestBody = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart(
                    "image_file", "image.jpg",
                    streamArray.toRequestBody("image/jpeg".toMediaTypeOrNull())
                )
                .addFormDataPart(
                    "mask_file", "mask.jpg",
                    maskArray.toRequestBody("image/jpeg".toMediaTypeOrNull())
                )
                .build()

            try {
                val request = Request.Builder()
                    .url("https://apis.clipdrop.co/cleanup/v1")
                    .addHeader(
                        "x-api-key",
                        BuildConfig.API_KEY
                    )
                    .post(requestBody)
                    .build()


                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val bodyStream = response.body?.bytes()
                        bodyStream?.let {
                            val bitmapResult =
                                BitmapFactory.decodeByteArray(bodyStream, 0, bodyStream.size)
                            withContext(Dispatchers.Main) {
                                bitmapListener.onBitmapReceived(bitmapResult)
                            }
                        }
                    } else {
                        Log.e("TAG", response.message)
                        // Handle Api Errors here
                    }
                }
            } catch (e: Exception) {
                Log.e("TAG", e.message.toString())
                // Handle Exceptions here
            }
        }

    interface BitmapListener {
        fun onBitmapReceived(bitmap: Bitmap)
    }

    public override fun onResume() {
        super.onResume()
        Log.d(TAG, "onResume")
        createImageProcessor()
        tryReloadAndDetectInImage()
    }

    public override fun onPause() {
        super.onPause()
        imageProcessor?.run {
            this.stop()
        }
    }

    public override fun onDestroy() {
        super.onDestroy()
        imageProcessor?.run {
            this.stop()
        }
    }

    public override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putParcelable(
            KEY_IMAGE_URI,
            imageUri
        )
        outState.putInt(
            KEY_IMAGE_MAX_WIDTH,
            imageMaxWidth
        )
        outState.putInt(
            KEY_IMAGE_MAX_HEIGHT,
            imageMaxHeight
        )
        outState.putString(
            KEY_SELECTED_SIZE,
            selectedSize
        )
    }

    private fun startCameraIntentForResult() { // Clean up last time's image
        imageUri = null
        preview!!.setImageBitmap(null)
        val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (takePictureIntent.resolveActivity(packageManager) != null) {
            val values = ContentValues()
            values.put(MediaStore.Images.Media.TITLE, "New Picture")
            values.put(MediaStore.Images.Media.DESCRIPTION, "From Camera")
            imageUri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
            takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, imageUri)
            startActivityForResult(
                takePictureIntent,
                REQUEST_IMAGE_CAPTURE
            )
        }
    }

    private fun startChooseImageIntentForResult() {
        val intent = Intent()
        intent.type = "image/*"
        intent.action = Intent.ACTION_GET_CONTENT
        startActivityForResult(
            Intent.createChooser(intent, "Select Picture"),
            REQUEST_CHOOSE_IMAGE
        )
    }

    override fun onActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == Activity.RESULT_OK) {
            tryReloadAndDetectInImage()
        } else if (requestCode == REQUEST_CHOOSE_IMAGE && resultCode == Activity.RESULT_OK) {
            // In this case, imageUri is returned by the chooser, save it.
            imageUri = data!!.data
            tryReloadAndDetectInImage()
        } else {
            super.onActivityResult(requestCode, resultCode, data)
        }
    }

    private fun tryReloadAndDetectInImage() {
        Log.d(
            TAG,
            "Try reload and detect image"
        )
        try {
            if (imageUri == null) {
                return
            }

            if (SIZE_SCREEN == selectedSize && imageMaxWidth == 0) {
                // UI layout has not finished yet, will reload once it's ready.
                return
            }

            val imageBitmap =
                BitmapUtils.getBitmapFromContentUri(contentResolver, imageUri) ?: return
            // Clear the overlay first
            graphicOverlay!!.clear()

            val resizedBitmap: Bitmap


            // Get the dimensions of the image view
            val targetedSize: Pair<Int, Int> = targetedWidthHeight

            // Determine how much to scale down the image
            val scaleFactor = Math.max(
                imageBitmap.width.toFloat() / targetedSize.first.toFloat(),
                imageBitmap.width.toFloat() / targetedSize.first.toFloat()
            )
            resizedBitmap = Bitmap.createScaledBitmap(
                imageBitmap,
                (imageBitmap.width / scaleFactor).toInt(),
                (imageBitmap.height / scaleFactor).toInt(),
                true
            )

            preview!!.setImageBitmap(resizedBitmap)
            if (imageProcessor != null) {
                graphicOverlay!!.setImageSourceInfo(
                    resizedBitmap.width, resizedBitmap.height, /* isFlipped= */false, resizedBitmap
                )

                var checked = false
                graphicOverlay?.setOnGraphicChanged(object : GraphicOverlay.OnGraphicsChanged {
                    override fun onComplete(graphics: List<GraphicOverlay.Graphic>) {
                        chipGroup?.visibility = View.VISIBLE
                        findViewById<View>(R.id.textSelection).visibility = View.GONE
                        graphicOverlay?.isTextSelected = false
                        graphicOverlay?.text = ""
                        textArea?.setText("")
                        textArea?.setTextColor(Color.BLACK)

                        chipGroup?.removeAllViews()

                        graphics.onEach { graphic ->
                            (graphic as? TextGraphic)?.text?.textBlocks?.forEach { text ->
                                text.lines.forEach { line ->
                                    val chip = layoutInflater.inflate(
                                        R.layout.chip_layout,
                                        root.parent.parent as ViewGroup,
                                        false
                                    ) as Chip
                                    chip.text = line.text
                                    if (!checked) {
                                        confirmText?.visibility = View.VISIBLE
                                        chip.isChecked = true
                                        graphicOverlay?.selectedText = line.text
                                        checked = true
                                    }
                                    chipGroup?.addView(chip)
                                }
                            }
                        }
                    }
                })

                chipGroup?.setOnCheckedStateChangeListener { group, checkedId ->
                    graphicOverlay?.selectedText =
                        group.findViewById<Chip>(checkedId[0]).text.toString()
                    // Responds to child chip checked/unchecked
                }
                graphicOverlay!!.layoutParams =
                    ConstraintLayout.LayoutParams(graphicOverlay!!.width, resizedBitmap.height)
                imageProcessor!!.processBitmap(resizedBitmap, graphicOverlay)
            } else {
                Log.e(
                    TAG,
                    "Null imageProcessor, please check adb logs for imageProcessor creation error"
                )
            }
        } catch (e: IOException) {
            Log.e(
                TAG,
                "Error retrieving saved image"
            )
            imageUri = null
        }
    }


    private val targetedWidthHeight: Pair<Int, Int>
        get() {
            val targetWidth: Int
            val targetHeight: Int
            when (selectedSize) {
                SIZE_SCREEN -> {
                    targetWidth = imageMaxWidth
                    targetHeight = imageMaxHeight
                }
                else -> throw IllegalStateException("Unknown size")
            }
            return Pair(targetWidth, targetHeight)
        }

    private fun createImageProcessor() {
        try {
            when (selectedMode) {
                TEXT_RECOGNITION_LATIN ->
                    imageProcessor =
                        TextRecognitionProcessor(this, TextRecognizerOptions.Builder().build())
                else -> Log.e(
                    TAG,
                    "Unknown selectedMode: $selectedMode"
                )
            }
        } catch (e: Exception) {
            Log.e(
                TAG,
                "Can not create image processor: $selectedMode",
                e
            )
            Toast.makeText(
                applicationContext,
                "Can not create image processor: " + e.message,
                Toast.LENGTH_LONG
            )
                .show()
        }
    }

    companion object {
        private const val TAG = "StillImageActivity"
        private const val TEXT_RECOGNITION_LATIN = "Text Recognition Latin"

        private const val SIZE_SCREEN = "w:screen" // Match screen width

        private const val KEY_IMAGE_URI = "com.google.mlkit.vision.demo.KEY_IMAGE_URI"
        private const val KEY_IMAGE_MAX_WIDTH = "com.google.mlkit.vision.demo.KEY_IMAGE_MAX_WIDTH"
        private const val KEY_IMAGE_MAX_HEIGHT = "com.google.mlkit.vision.demo.KEY_IMAGE_MAX_HEIGHT"
        private const val KEY_SELECTED_SIZE = "com.google.mlkit.vision.demo.KEY_SELECTED_SIZE"
        private const val REQUEST_IMAGE_CAPTURE = 1001
        private const val REQUEST_CHOOSE_IMAGE = 1002
    }
}
