<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Mode
    |--------------------------------------------------------------------------
    |
    | The mode of operation for the AI assistant.
    | - 'passages': Return cited passages directly (no LLM generation)
    | - 'generative': Use LLM to generate an answer with citations
    |
    */
    'mode' => env('AI_MODE', 'passages'),

    /*
    |--------------------------------------------------------------------------
    | Hybrid Search Parameters
    |--------------------------------------------------------------------------
    |
    | These parameters control the hybrid search behavior.
    |
    */
    'min_keyword_rank' => env('AI_MIN_KEYWORD_RANK', 0.1),
    'min_cosine_similarity' => env('AI_MIN_COSINE_SIMILARITY', 0.4), // equivalent to max_distance
    'top_n' => env('AI_TOP_N', 6),
    'max_chunks_per_doc' => env('AI_MAX_CHUNKS_PER_DOC', 2),
    'history_turns' => env('AI_HISTORY_TURNS', 6),
    'per_arm_limit' => env('AI_PER_ARM_LIMIT', 20), // Number to retrieve from each arm before combining

    /*
    |--------------------------------------------------------------------------
    | Citation Verification
    |--------------------------------------------------------------------------
    |
    | Whether to verify that generated answers are supported by the citations.
    | This is only relevant in 'generative' mode.
    |
    */
    'verify_quotes' => env('AI_VERIFY_QUOTES', true),

    /*
    |--------------------------------------------------------------------------
    | Gemini API Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for the Gemini embedding model (and potentially LLM in the future).
    |
    */
    'embedder_batch_size' => env('AI_EMBEDDER_BATCH_SIZE', 25),

    /*
    |--------------------------------------------------------------------------
    | Notices and Disclaimers
    |--------------------------------------------------------------------------
    |
    | These notices are returned with every AI response to inform users about
    | the AI-powered nature of the feature.
    |
    */
    'notice' => env('AI_NOTICE', 'This is an AI-powered feature. Responses may be inaccurate or incomplete.'),

];