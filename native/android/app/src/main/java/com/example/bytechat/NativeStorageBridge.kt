package com.example.bytechat

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.webkit.JavascriptInterface

class KvDbHelper(context: Context) : SQLiteOpenHelper(context, "bytechat_kv.db", null, 1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE kv_store (
              uid TEXT,
              k TEXT NOT NULL,
              v TEXT,
              updated_at INTEGER,
              PRIMARY KEY(uid, k)
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // no-op for now
    }
}

class NativeStorageBridge(context: Context) {
    private val dbHelper = KvDbHelper(context.applicationContext)

    @JavascriptInterface
    fun get(key: String, uid: String? = null): String? {
        val db = dbHelper.readableDatabase
        val cursor = db.query(
            "kv_store",
            arrayOf("v"),
            "uid IS ? AND k = ?",
            arrayOf(uid, key),
            null,
            null,
            null
        )
        cursor.use {
            if (it.moveToFirst()) {
                return it.getString(0)
            }
        }
        return null
    }

    @JavascriptInterface
    fun set(key: String, value: String, uid: String? = null) {
        val db = dbHelper.writableDatabase
        val cv = ContentValues().apply {
            put("uid", uid)
            put("k", key)
            put("v", value)
            put("updated_at", System.currentTimeMillis())
        }
        db.insertWithOnConflict("kv_store", null, cv, SQLiteDatabase.CONFLICT_REPLACE)
    }

    @JavascriptInterface
    fun remove(key: String, uid: String? = null) {
        val db = dbHelper.writableDatabase
        db.delete("kv_store", "uid IS ? AND k = ?", arrayOf(uid, key))
    }
}
