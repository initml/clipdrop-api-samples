package com.initml.camerasample

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.net.Uri
import android.provider.MediaStore
import androidx.camera.core.ImageProxy
import java.io.ByteArrayOutputStream

fun Bitmap.rotateBit(image: ImageProxy): Bitmap {
    val orientation: Int = image.imageInfo.rotationDegrees

    return if (orientation == 0)
        this
    else
        this.rotateImage(orientation.toFloat())
}

fun Bitmap.rotateImage(angle: Float) : Bitmap {
    val matrix = Matrix()
    matrix.postRotate(angle)
    return Bitmap.createBitmap(
        this, 0, 0, width, height,
        matrix, true
    )
}

fun Bitmap.getImageUri(context: Context): Uri {
    val bytes = ByteArrayOutputStream()
    this.compress(Bitmap.CompressFormat.PNG, 100, bytes)
    val path = MediaStore.Images.Media.insertImage(context.contentResolver,
        this,
        "Image",
        null)
    return Uri.parse(path)
}
