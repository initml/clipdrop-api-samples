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

package co.clipdrop.textdetector

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import android.util.Log
import co.clipdrop.GraphicOverlay
import co.clipdrop.GraphicOverlay.Graphic
import com.google.mlkit.vision.text.Text
import kotlin.math.max
import kotlin.math.min

/**
 * Graphic instance for rendering TextBlock position, size, and ID within an associated graphic
 * overlay view.
 */
class TextGraphic
constructor(
  overlay: GraphicOverlay,
  val text: Text,
  private val shouldGroupTextInBlocks: Boolean,
  private val showLanguageTag: Boolean
) : Graphic(overlay) {

  private val rectPaint: Paint = Paint()
  private val rectPaintStatic: Paint = Paint()
  private val textPaint: Paint
  private val labelPaint: Paint

  init {
    rectPaint.style = Paint.Style.FILL
    rectPaint.strokeWidth = STROKE_WIDTH
    textPaint = Paint()
    textPaint.color = TEXT_COLOR
    textPaint.textSize = TEXT_SIZE

    rectPaintStatic.style = Paint.Style.FILL
    rectPaintStatic.strokeWidth = STROKE_WIDTH
    rectPaintStatic.color = Color.argb(100, 190, 190, 255)

    labelPaint = Paint()
    labelPaint.style = Paint.Style.FILL
    // Redraw the overlay, as this graphic has been added.
    postInvalidate()
  }

  /** Draws the text block annotations for position, size, and raw value on the supplied canvas. */
  override fun draw(
    canvas: Canvas,
    waveRadiusOffset: Float,
    selectedText: String?,
    generateMask: Boolean
  ) {
    Log.d(TAG, "Text is: " + text.text)
    for (textBlock in text.textBlocks) { // Renders the text at the bottom of the box.
//      Log.d(TAG, "TextBlock text is: " + textBlock.text)
//      Log.d(TAG, "TextBlock boundingbox is: " + textBlock.boundingBox)
//      Log.d(TAG, "TextBlock cornerpoint is: " + Arrays.toString(textBlock.cornerPoints))
      if (shouldGroupTextInBlocks) {
        drawText(
          getFormattedText(textBlock.text, textBlock.recognizedLanguage),
          RectF(textBlock.boundingBox),
          TEXT_SIZE * textBlock.lines.size + 2 * STROKE_WIDTH,
          canvas,
          selectedText,
          waveRadiusOffset,
          generateMask
        )
      } else {
        for (line in textBlock.lines) {
//          Log.d(TAG, "Line text is: " + line.text)
//          Log.d(TAG, "Line boundingbox is: " + line.boundingBox)
//          Log.d(TAG, "Line cornerpoint is: " + Arrays.toString(line.cornerPoints))
          // Draws the bounding box around the TextBlock.
          val rect = RectF(line.boundingBox)
          drawText(
            getFormattedText(line.text, line.recognizedLanguage),
            rect,
            TEXT_SIZE + 2 * STROKE_WIDTH,
            canvas,
            selectedText,
            waveRadiusOffset,
            generateMask
          )
          for (element in line.elements) {
//            Log.d(TAG, "Element text is: " + element.text)
//            Log.d(TAG, "Element boundingbox is: " + element.boundingBox)
//            Log.d(TAG, "Element cornerpoint is: " + Arrays.toString(element.cornerPoints))
//            Log.d(TAG, "Element language is: " + element.recognizedLanguage)
          }
        }
      }
    }
  }

  private fun getFormattedText(text: String, languageTag: String): String {
    if (showLanguageTag) {
      return String.format(
        TEXT_WITH_LANGUAGE_TAG_FORMAT,
        languageTag,
        text
      )
    }
    return text
  }

  private fun drawText(
    text: String,
    rect: RectF,
    textHeight: Float,
    canvas: Canvas,
    selectedText: String?,
    waveRadiusOffset: Float,
    generateMask: Boolean
  ) {
    // If the image is flipped, the left will be translated to right, and the right to left.
    val x0 = translateX(rect.left)
    val x1 = translateX(rect.right)
    rect.left = min(x0, x1)
    rect.right = max(x0, x1)
    rect.top = translateY(rect.top)
    rect.bottom = translateY(rect.bottom)
//    canvas.drawRect(rect, rectPaint)
    if (generateMask) {
      if (text == selectedText) {
        rectPaint.color = Color.WHITE
        canvas.drawRoundRect(rect, 10f, 10f, rectPaint)
      } else {
        // do not show
      }
    } else {
      if (text == selectedText) {
        rectPaint.color = Color.argb(waveRadiusOffset.toInt(), 255, 0, 0)
        canvas.drawRoundRect(rect, 10f, 10f, rectPaint)
      } else {
        canvas.drawRoundRect(rect, 10f, 10f, rectPaintStatic)
      }
    }

//    val textWidth = textPaint.measureText(text)
//    canvas.drawRect(
//      rect.left - STROKE_WIDTH,
//      rect.top - textHeight,
//      rect.left + textWidth + 2 * STROKE_WIDTH,
//      rect.top,
//      labelPaint
//    )
//    // Renders the text at the bottom of the box.
//    canvas.drawText(text, rect.left, rect.top - STROKE_WIDTH, textPaint)
  }

  private fun getRoundedCornerBitmap(bitmap: Bitmap, pixels: Int): Bitmap {
    val output = Bitmap.createBitmap(bitmap.width, bitmap
      .height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(output)
    val color = -0xbdbdbe
    val paint = Paint()
    val rect = Rect(0, 0, bitmap.width, bitmap.height)
    val rectF = RectF(rect)
    val roundPx = pixels.toFloat()
    paint.isAntiAlias = true
    canvas.drawARGB(0, 0, 0, 0)
    paint.color = color
    canvas.drawRoundRect(rectF, roundPx, roundPx, paint)
    paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
    canvas.drawBitmap(bitmap, rect, rect, paint)
    return output
  }

  companion object {
    private const val TAG = "TextGraphic"
    private const val TEXT_WITH_LANGUAGE_TAG_FORMAT = "%s:%s"
    private const val TEXT_COLOR = Color.BLACK
    private const val TEXT_SIZE = 54.0f
    private const val STROKE_WIDTH = 4.0f
  }
}
