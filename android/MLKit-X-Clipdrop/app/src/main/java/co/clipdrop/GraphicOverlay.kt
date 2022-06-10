/*
 * Copyright 2020 Google LLC. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package co.clipdrop

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Paint.Align
import android.graphics.Rect
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.core.content.res.ResourcesCompat
import co.clipdrop.GraphicOverlay.Graphic
import co.clipdrop.textdetector.TextGraphic
import com.clipdrop.mlvisonxclipdrop.R
import com.google.common.base.Preconditions


/**
 * A view which renders a series of custom graphics to be overlayed on top of an associated preview
 * (i.e., the camera preview). The creator can add graphics objects, update the objects, and remove
 * them, triggering the appropriate drawing and invalidation within the view.
 *
 *
 * Supports scaling and mirroring of the graphics relative the camera's preview properties. The
 * idea is that detection items are expressed in terms of an image size, but need to be scaled up
 * to the full view size, and also mirrored in the case of the front-facing camera.
 *
 *
 * Associated [Graphic] items should use the following methods to convert to view
 * coordinates for the graphics that are drawn:
 *
 *
 *  1. [Graphic.scale] adjusts the size of the supplied value from the image scale
 * to the view scale.
 *  1. [Graphic.translateX] and [Graphic.translateY] adjust the
 * coordinate from the image's coordinate system to the view coordinate system.
 *
 */
class GraphicOverlay(
    context: Context?,
    attrs: AttributeSet?,
) : View(context, attrs), View.OnTouchListener {

    interface OnGraphicsChanged {
        fun onComplete(graphics: List<GraphicOverlay.Graphic>)
    }

    private var eventY: Float = -1f
    private var eventX: Float = -1f
    var isTextSelected: Boolean = false
        set(value) {
            if (!value) {
                eventX = -1f
                eventY = -1f
            }
            field = value
            postInvalidate()
        }

    var text: String = ""
        set(value) {
            field = value
            postInvalidate()
        }

    var textColor: Int = Color.BLACK
        set(value) {
            field = value
            postInvalidate()
        }


    private val lock = Any()
    private var graphics: MutableList<Graphic> = ArrayList()

    var selectedText: String? = null
        set(value) {
            field = value
            postInvalidateOnAnimation()
        }

    var onGraphicsChanged: OnGraphicsChanged? = null


    // Matrix for transforming from image coordinates to overlay view coordinates.
    private val transformationMatrix = Matrix()
    var imageWidth = 0
        private set
    var imageHeight = 0
        private set

    // The factor of overlay View size to image size. Anything in the image coordinates need to be
    // scaled by this amount to fit with the area of overlay View.
    private var scaleFactor = 1.0f

    // The number of horizontal pixels needed to be cropped on each side to fit the image with the
    // area of overlay View after scaling.
    private var postScaleWidthOffset = 0f

    // The number of vertical pixels needed to be cropped on each side to fit the image with the
    // area of overlay View after scaling.
    private var postScaleHeightOffset = 0f
    private var isImageFlipped = false
    private var needUpdateTransformation = true
    var bitmap: Bitmap? = null
    var logo: Bitmap? = null

    /**
     * Base class for a custom graphics object to be rendered within the graphic overlay. Subclass
     * this and implement the [Graphic.draw] method to define the graphics element. Add
     * instances to the overlay using [GraphicOverlay.add].
     */
    abstract class Graphic(private val overlay: GraphicOverlay) {
        /**
         * Draw the graphic on the supplied canvas. Drawing should use the following methods to convert
         * to view coordinates for the graphics that are drawn:
         *
         *
         *  1. [Graphic.scale] adjusts the size of the supplied value from the image
         * scale to the view scale.
         *  1. [Graphic.translateX] and [Graphic.translateY] adjust the
         * coordinate from the image's coordinate system to the view coordinate system.
         *
         *
         * @param canvas drawing canvas
         */
        abstract fun draw(
            canvas: Canvas,
            waveRadiusOffset: Float,
            selectedText: String?,
            generateMask: Boolean
        )

        /** Adjusts the supplied value from the image scale to the view scale.  */
        fun scale(imagePixel: Float): Float {
            return imagePixel * overlay.scaleFactor
        }

        /** Returns the application context of the app.  */
        val applicationContext: Context
            get() = overlay.context.applicationContext

        fun isImageFlipped(): Boolean {
            return overlay.isImageFlipped
        }

        /**
         * Adjusts the x coordinate from the image's coordinate system to the view coordinate system.
         */
        fun translateX(x: Float): Float {
            return if (overlay.isImageFlipped) {
                overlay.width - (scale(x) - overlay.postScaleWidthOffset)
            } else {
                scale(x) - overlay.postScaleWidthOffset
            }
        }

        /**
         * Adjusts the y coordinate from the image's coordinate system to the view coordinate system.
         */
        fun translateY(y: Float): Float {
            return scale(y) - overlay.postScaleHeightOffset
        }

        /**
         * Returns a [Matrix] for transforming from image coordinates to overlay view coordinates.
         */
        fun getTransformationMatrix(): Matrix {
            return overlay.transformationMatrix
        }

        fun postInvalidate() {
            overlay.postInvalidate()
        }
    }

    init {
        addOnLayoutChangeListener { view: View?, left: Int, top: Int, right: Int, bottom: Int, oldLeft: Int, oldTop: Int, oldRight: Int, oldBottom: Int ->
            needUpdateTransformation = true
        }
        setOnTouchListener(this)
    }

    /** Removes all graphics from the overlay.  */
    fun clear() {
        synchronized(lock) { graphics.clear() }
        postInvalidate()
    }

    /** Adds a graphic to the overlay.  */
    fun add(graphic: Graphic) {
        synchronized(lock) {
            graphics.add(graphic)
            onGraphicsChanged?.onComplete(graphics)
        }
    }

    /** Removes a graphic from the overlay.  */
    fun remove(graphic: Graphic) {
        synchronized(lock) { graphics.remove(graphic) }
        postInvalidate()
    }

    fun setImageSourceInfo(imageWidth: Int, imageHeight: Int, isFlipped: Boolean) {
        setImageSourceInfo(imageWidth, imageHeight, isFlipped, null)
    }

    /**
     * Sets the source information of the image being processed by detectors, including size and
     * whether it is flipped, which informs how to transform image coordinates later.
     * @param imageWidth the width of the image sent to ML Kit detectors
     * @param imageHeight the height of the image sent to ML Kit detectors
     * @param isFlipped whether the image is flipped. Should set it to true when the image is from the
     * @param resizedBitmap
     */
    fun setImageSourceInfo(
        imageWidth: Int,
        imageHeight: Int,
        isFlipped: Boolean,
        resizedBitmap: Bitmap?
    ) {
        Preconditions.checkState(imageWidth > 0, "image width must be positive")
        Preconditions.checkState(imageHeight > 0, "image height must be positive")
        synchronized(lock) {
            this.imageWidth = imageWidth
            this.imageHeight = imageHeight
            isImageFlipped = isFlipped
            bitmap = resizedBitmap
            needUpdateTransformation = true
        }
        postInvalidate()
    }

    private fun updateTransformationIfNeeded() {
        if (!needUpdateTransformation || imageWidth <= 0 || imageHeight <= 0) {
            return
        }
        val viewAspectRatio = width.toFloat() / height
        val imageAspectRatio = imageWidth.toFloat() / imageHeight
        postScaleWidthOffset = 0f
        postScaleHeightOffset = 0f
        if (viewAspectRatio > imageAspectRatio) {
            // The image needs to be vertically cropped to be displayed in this view.
            scaleFactor = width.toFloat() / imageWidth
            postScaleHeightOffset = (width.toFloat() / imageAspectRatio - height) / 2
        } else {
            // The image needs to be horizontally cropped to be displayed in this view.
            scaleFactor = height.toFloat() / imageHeight
            postScaleWidthOffset = (height.toFloat() * imageAspectRatio - width) / 2
        }
        transformationMatrix.reset()
        transformationMatrix.setScale(scaleFactor, scaleFactor)
        transformationMatrix.postTranslate(-postScaleWidthOffset, -postScaleHeightOffset)
        if (isImageFlipped) {
            transformationMatrix.postScale(-1f, 1f, width / 2f, height / 2f)
        }
        needUpdateTransformation = false
    }

    private var waveAnimator: ValueAnimator? = null
    private var waveRadiusOffset = 0f
        set(value) {
            field = value
            postInvalidateOnAnimation()
        }

    fun setOnGraphicChanged(onGraphicsChanged: OnGraphicsChanged) {
        this.onGraphicsChanged = onGraphicsChanged
    }
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        waveAnimator = ValueAnimator.ofFloat(220f, 80f).apply {
            addUpdateListener {
                waveRadiusOffset = it.animatedValue as Float
            }
            duration = 1000L
            repeatMode = ValueAnimator.RESTART
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
    }

    override fun onDetachedFromWindow() {
        waveAnimator?.cancel()
        super.onDetachedFromWindow()
    }

    var exportMask: Bitmap? = null
        get() {

        val clipImage = bitmap!!
        val rectPaint: Paint = Paint()

        val bitmapOut = Bitmap.createBitmap(clipImage.width, clipImage.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmapOut)

        canvas.drawRect( 0f, 0f, clipImage.width.toFloat(), clipImage.height.toFloat(), rectPaint)

        for (graphic in graphics) {
            graphic.draw(canvas, waveRadiusOffset, selectedText, true)
        }

        return bitmapOut
    }

    var exportRec: Bitmap? = null
        get() {
        var rect : Rect? = null

        for (graphic in graphics) {
            (graphic as TextGraphic).text.textBlocks.forEach {
                it.lines.forEach {  line ->
                    if (line.text == selectedText) {
                        rect = line.boundingBox
                    }
                }
            }
        }

       return if (rect != null) {
            val subImage = Bitmap.createBitmap(
                rect!!.width(),
                rect!!.height(), Bitmap.Config.ARGB_8888
            )
            val c = Canvas(subImage)
            c.drawBitmap(
                bitmap!!, rect!!,
                Rect(0, 0, rect!!.width(), rect!!.height()), null
            )
            subImage
        } else {
            bitmap!!
        }

    }

    fun getSubimage(b: Bitmap, copyRect: Rect): Bitmap? {
        // Extracts a part of a Bitmap defined by copyRect.
        val subImage = Bitmap.createBitmap(
            copyRect.width(),
            copyRect.height(), Bitmap.Config.ARGB_8888
        )
        val c = Canvas(subImage)
        c.drawBitmap(
            b, copyRect,  //from   w w w . j a va  2  s. c o m
            Rect(0, 0, copyRect.width(), copyRect.height()), null
        )
        return subImage
    }

    /** Draws the overlay with its associated graphic objects.  */
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        synchronized(lock) {
            updateTransformationIfNeeded()


            if (bitmap != null) {
//                val topValue = (height.toFloat() - bitmap!!.height.toFloat()) / 2.0f
//                val leftValue = (width.toFloat() - bitmap!!.width.toFloat()) / 2.0f
//                Log.v("VALUEFLOAT", height.toString())
//                Log.v("VALUEFLOAT", topValue.toString())
                canvas.drawBitmap(bitmap!!, 0f, 0f, null)
            } else {
                val topValue = (height.toFloat() - logo!!.height.toFloat()) / 2.0f
                val leftValue = (width.toFloat() - logo!!.width.toFloat()) / 2.0f
                canvas.drawBitmap(logo!!, leftValue, topValue, null)
            }
            if (isTextSelected) {
                for (graphic in graphics) {
                    (graphic as TextGraphic).text.textBlocks.forEach {
                        it.lines.forEach {  line ->
                            if (line.text == selectedText) {
                                val testTextSize = 48f;
                                val textPaint = Paint()
                                textPaint.color = textColor
                                val bounds = Rect()
                                textPaint.getTextBounds(text, 0, text.length, bounds);
                                textPaint.textAlign = Align.CENTER
                                textPaint.textSize = 100f
                                val customTypeface = ResourcesCompat.getFont(context, R.font.soleil)
                                textPaint.typeface = customTypeface;

                                if (eventX != -1f && eventY != -1f) {
                                    canvas.drawText(
                                        text,
                                        eventX,
                                        eventY, textPaint
                                    )
                                } else {
                                    canvas.drawText(
                                        text,
                                        line.boundingBox!!.exactCenterX(),
                                        line.boundingBox!!.exactCenterY(), textPaint
                                    )
                                }

                            }
                        }
                    }
                }
            } else {
                for (graphic in graphics) {
                    graphic.draw(canvas, waveRadiusOffset, selectedText, isTextSelected)
                }
            }
        }
    }

    fun updateBitmap(bitmap: Bitmap) {
        this.bitmap = bitmap
        postInvalidate()
    }

    fun updateLogo(bitmap: Bitmap, rootWidth : Int) {
        this.logo = Bitmap.createScaledBitmap(bitmap,
            (rootWidth),
            (rootWidth),  false)
        postInvalidate()
    }


    private val THRESHOLD_X = 120
    private val THRESHOLD_Y = 120
    private val NONE = 0
    private val MOVE = 1
    private var mode = NONE

    override fun onTouch(v: View?, event: MotionEvent?): Boolean {
        if(!isTextSelected) {
            return true
        }

        eventX = event?.x ?: -1f
        eventY = event?.y ?: -1f
        when (event?.action) {
            MotionEvent.ACTION_MOVE -> {
            }
            MotionEvent.ACTION_UP -> {}
            else -> return false
        }

        // Schedules a repaint.
        invalidate()
        return true
    }
}