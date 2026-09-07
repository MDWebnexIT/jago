package com.jagocorp.officemanagement

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.widget.Toast
import com.getcapacitor.BridgeActivity
import java.io.File
import java.io.FileOutputStream

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Native Kotlin WebEngine Optimization & File Download Bridge
        bridge?.webView?.let { webView ->
            val settings: WebSettings = webView.settings
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            @Suppress("DEPRECATION")
            settings.databaseEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.setSupportZoom(false)
            settings.builtInZoomControls = false
            settings.displayZoomControls = false
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            // Attach Native JavaScript Interface for Android Downloads (PDF, JSON, Documents)
            webView.addJavascriptInterface(AndroidDownloadBridge(this), "AndroidHost")
            
            // Intercept standard browser download requests inside WebView
            webView.setDownloadListener { url, _, _, mimetype, _ ->
                if (url != null && url.startsWith("data:")) {
                    val fileName = "Jago_Download_${System.currentTimeMillis()}." + when {
                        mimetype?.contains("pdf") == true || url.contains("pdf") -> "pdf"
                        mimetype?.contains("json") == true || url.contains("json") -> "json"
                        else -> "bin"
                    }
                    AndroidDownloadBridge(this).downloadFile(url, fileName, mimetype ?: "application/octet-stream")
                }
            }
        }
    }
}

class AndroidDownloadBridge(private val context: Context) {
    @JavascriptInterface
    fun downloadFile(base64Data: String, fileName: String, mimeType: String) {
        try {
            val cleanBase64 = if (base64Data.contains(",")) {
                base64Data.substringAfter(",")
            } else {
                base64Data
            }
            val fileBytes = Base64.decode(cleanBase64, Base64.DEFAULT)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val resolver = context.contentResolver
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                val uri: Uri? = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { outputStream ->
                        outputStream.write(fileBytes)
                    }
                    showToast("✅ Saved to Downloads: $fileName")
                } else {
                    saveToLegacyDownloads(fileBytes, fileName)
                }
            } else {
                saveToLegacyDownloads(fileBytes, fileName)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            showToast("⚠️ Download failed: ${e.localizedMessage}")
        }
    }

    private fun saveToLegacyDownloads(fileBytes: ByteArray, fileName: String) {
        try {
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            if (!downloadsDir.exists()) {
                downloadsDir.mkdirs()
            }
            val file = File(downloadsDir, fileName)
            FileOutputStream(file).use { fos ->
                fos.write(fileBytes)
            }
            showToast("✅ Saved to Downloads: $fileName")
        } catch (e: Exception) {
            e.printStackTrace()
            showToast("⚠️ Error saving file: ${e.localizedMessage}")
        }
    }

    private fun showToast(message: String) {
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        }
    }
}
