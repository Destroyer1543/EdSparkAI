package com.pathshala.modules.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "chunks")
data class TextbookChunk(
    @PrimaryKey val id: String,
    val subject: String,
    val grade: String,
    val chapter: String,
    val pageNum: Int,
    val content: String,
    val keywords: String = "",
)

@Entity(tableName = "attempts")
data class LearningAttempt(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val studentId: String,
    val chunkId: String,
    val topic: String,
    val isCorrect: Boolean,
    val timestamp: Long = System.currentTimeMillis(),
)
