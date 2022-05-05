package com.initml.camerasample

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaActionSound
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.UseCaseGroup
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.toBitmap
import androidx.core.view.isVisible
import androidx.lifecycle.lifecycleScope
import com.initml.camerasample.databinding.ActivityMainBinding
import java.nio.ByteBuffer

class MainActivity : AppCompatActivity() {

    private var camera: Camera? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private lateinit var viewBinding: ActivityMainBinding
    private var imageCapture: ImageCapture? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewBinding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(viewBinding.root)

        // Wait for the views to be properly laid out
        viewBinding.viewFinder.post {
            setUpCamera()
        }

        if (!hasPermissions(this)) {
            // Request camera-related permissions
            requestPermissions(PERMISSIONS_REQUIRED, Companion.PERMISSIONS_REQUEST_CODE)
        } else {
            // If permissions have already been granted, proceed
            setUpCamera()
        }

        viewBinding.imageCaptureButton.setOnClickListener {
            takePhoto()
        }

        viewBinding.share.setOnClickListener {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "image/*"
                flags = Intent.FLAG_ACTIVITY_NEW_TASK;
                putExtra(Intent.EXTRA_STREAM,
                    viewBinding.imageView.drawable.toBitmap()
                        .getImageUri(this@MainActivity))
            }

            try {
                startActivity(Intent.createChooser(intent, "Send Picture"))
            } catch (ex: ActivityNotFoundException) {
                ex.printStackTrace()
            }
        }
    }

    private fun takePhoto() {
        viewBinding.loading.isVisible = true
        viewBinding.overlay.isVisible = true
        viewBinding.imageView.isVisible = false

        val mediaActionSound = MediaActionSound()
        mediaActionSound.play(MediaActionSound.SHUTTER_CLICK)

        val imageCapture = imageCapture ?: return

        imageCapture.takePicture(
            ContextCompat.getMainExecutor(this),
            object :
                ImageCapture.OnImageCapturedCallback() {
                override fun onCaptureSuccess(image: ImageProxy) {
                    val buffer: ByteBuffer = image.planes[0].buffer
                    val bytes = ByteArray(buffer.capacity())
                    buffer.get(bytes)
                    val bitmapImage = BitmapFactory.decodeByteArray(bytes, 0, bytes.size, null)
                    val bitmapRotate = bitmapImage.rotateBit(image)

                    lifecycleScope.launchWhenCreated {
                        bitmapRotate.clipApiProcess(object : BitmapListener {
                            override fun onBitmapReceived(bitmap: Bitmap) {
                                viewBinding.imageView.setImageBitmap(bitmap)
                                viewBinding.imageView.isVisible = true
                                viewBinding.share.isVisible = true
                                viewBinding.loading.isVisible = false
                            }
                        })
                    }
                    image.close()
                }
            })
    }


    /** Initialize CameraX, and prepare to bind the camera use cases  */
    private fun setUpCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()
            startCamera()
        }, ContextCompat.getMainExecutor(this))
    }

    private fun startCamera() {
        // Used to bind the lifecycle of cameras to the lifecycle owner
        // CameraProvider
        val cameraProvider = cameraProvider
            ?: throw IllegalStateException("Camera initialization failed.")

        val rotation = viewBinding.viewFinder.display.rotation

        // Preview
        val preview = Preview.Builder()
            // Set initial target rotation
            .setTargetRotation(rotation)
            .build()

        imageCapture = ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .setTargetRotation(rotation)
            .build()

        // Select back camera as a default
        val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

        try {
            // Unbind use cases before rebinding
            cameraProvider.unbindAll()

            // Not working

            imageCapture?.let {
                val useCaseGroup = UseCaseGroup.Builder()
                    .addUseCase(preview) //your preview
                    .addUseCase(it)
                    .build()

                // Bind use cases to camera
                camera = cameraProvider.bindToLifecycle(
                    this, cameraSelector, useCaseGroup
                )

                preview.setSurfaceProvider(viewBinding.viewFinder.surfaceProvider)
            }
        } catch (exc: Exception) {
            Log.e(TAG, "Use case binding failed", exc)
        }
    }


    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<String>, grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == Companion.PERMISSIONS_REQUEST_CODE) {
            if (PackageManager.PERMISSION_GRANTED == grantResults.firstOrNull()) {
                // Take the user to the success fragment when permission is granted
                Toast.makeText(this, "Permission request granted", Toast.LENGTH_LONG).show()
                startCamera()
            } else {
                Toast.makeText(this, "Permission request denied", Toast.LENGTH_LONG).show()
            }
        }
    }

    companion object {
        private val PERMISSIONS_REQUIRED = arrayOf(Manifest.permission.CAMERA)
        private const val TAG: String = "ClipDropSample"

        /** Convenience method used to check if all permissions required by this app are granted */
        fun hasPermissions(context: Context) = PERMISSIONS_REQUIRED.all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }

        private const val PERMISSIONS_REQUEST_CODE = 10
    }
}

