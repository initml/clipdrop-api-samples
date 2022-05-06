package com.initml.camerasample

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import java.util.concurrent.TimeUnit

suspend fun Bitmap.clipApiProcess(bitmapListener: BitmapListener) = CoroutineScope(Dispatchers.Default).launch {
    val scaledBitmap = this@clipApiProcess
    val stream = ByteArrayOutputStream()
    scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream)
    val streamArray = stream.toByteArray()

    val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build();

    val requestBody = MultipartBody.Builder()
        .setType(MultipartBody.FORM)
        .addFormDataPart("image_file", "image.jpg",
            streamArray.toRequestBody("image/jpeg".toMediaTypeOrNull()))
        .build()

    try {
        val request = Request.Builder()
            .url("https://matting-dev-2fjujhplza-ez.a.run.app")
            .addHeader("x-api-key", BuildConfig.API_KEY)
            .post(requestBody)
            .build()

        client.newCall(request).execute().use { response ->
            if (response.isSuccessful) {
                val bodyStream = response.body?.bytes()
                bodyStream?.let {
                    val bitmapResult = BitmapFactory.decodeByteArray(bodyStream, 0, bodyStream.size)
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
