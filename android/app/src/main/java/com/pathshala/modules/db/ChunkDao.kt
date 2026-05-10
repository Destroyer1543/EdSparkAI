package com.pathshala.modules.db

import androidx.room.*

@Dao
interface ChunkDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChunks(chunks: List<TextbookChunk>)

    @Query("SELECT * FROM chunks WHERE (content LIKE '%' || :q || '%' OR keywords LIKE '%' || :q || '%') AND grade = :grade AND subject = :subject LIMIT 3")
    suspend fun search(q: String, grade: String, subject: String): List<TextbookChunk>

    @Query("SELECT * FROM chunks WHERE grade = :grade AND subject = :subject LIMIT 3")
    suspend fun fallback(grade: String, subject: String): List<TextbookChunk>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAttempt(attempt: LearningAttempt)

    @Query("SELECT topic, AVG(CASE WHEN isCorrect THEN 1.0 ELSE 0.0 END) as score FROM attempts WHERE studentId = :sid GROUP BY topic ORDER BY score ASC LIMIT 5")
    suspend fun weakTopics(sid: String): List<TopicScore>
}

data class TopicScore(val topic: String, val score: Double)
