<?php

/**
 * Breaking News block render.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

$block_attributes = wp_parse_args(
    $attributes ?? [],
    [
        'postId'        => 0,
        'postOverrides' => [],
        'label'         => 'Breaking News',

        /*
         * Legacy attribute kept temporarily for blocks created before
         * postOverrides became the canonical editorial override model.
         */
        'titleOverride' => '',
    ]
);

$post_id = absint($block_attributes['postId']);

if (0 === $post_id) {
    return;
}

$post = get_post($post_id);

if (
    ! $post instanceof WP_Post
    || 'post' !== $post->post_type
    || 'publish' !== get_post_status($post)
) {
    return;
}

if (
    function_exists('wtn_blocks_is_post_used')
    && wtn_blocks_is_post_used($post_id)
) {
    return;
}

$permalink = get_permalink($post);

if (
    ! is_string($permalink)
    || '' === $permalink
) {
    return;
}

$post_overrides = is_array($block_attributes['postOverrides'])
    ? $block_attributes['postOverrides']
    : [];

$legacy_override = [
    'titleOverride' => $block_attributes['titleOverride'],
];

$post_override = function_exists('wtn_blocks_get_editorial_post_override')
    ? wtn_blocks_get_editorial_post_override(
        $post_overrides,
        $post_id,
        $legacy_override
    )
    : [
        'titleOverride'   => (string) $block_attributes['titleOverride'],
        'excerptOverride' => '',
        'imageOverrideId' => 0,
    ];

$title = trim(
    wp_strip_all_tags(
        (string) $post_override['titleOverride']
    )
);

if ('' === $title) {
    $title = trim(
        wp_strip_all_tags(
            get_the_title($post)
        )
    );
}

if ('' === $title) {
    $title = __(
        'Matéria sem título',
        'wordpress-template-news-blocks'
    );
}

$label = trim(
    wp_strip_all_tags(
        (string) $block_attributes['label']
    )
);

if ('' === $label) {
    $label = __(
        'Breaking News',
        'wordpress-template-news-blocks'
    );
}

$post_timestamp = (int) get_post_time(
    'U',
    true,
    $post
);

$current_timestamp = (int) current_time(
    'timestamp',
    true
);

$time_label = '';

if ($post_timestamp > 0) {
    $diff_seconds = max(
        0,
        $current_timestamp - $post_timestamp
    );

    $diff_minutes = (int) floor(
        $diff_seconds / MINUTE_IN_SECONDS
    );

    if ($diff_minutes < 1) {
        $time_label = __(
            'agora',
            'wordpress-template-news-blocks'
        );
    } elseif ($diff_minutes < 60) {
        $time_label = sprintf(
            /* translators: %d: quantidade de minutos desde a publicação. */
            _n(
                'há %d min',
                'há %d min',
                $diff_minutes,
                'wordpress-template-news-blocks'
            ),
            $diff_minutes
        );
    } else {
        $diff_hours = (int) floor(
            $diff_minutes / 60
        );

        if ($diff_hours < 24) {
            $time_label = sprintf(
                /* translators: %d: quantidade de horas desde a publicação. */
                _n(
                    'há %d h',
                    'há %d h',
                    $diff_hours,
                    'wordpress-template-news-blocks'
                ),
                $diff_hours
            );
        } else {
            $time_label = get_the_date(
                'j M • H\hi',
                $post
            );
        }
    }
}

if (function_exists('wtn_blocks_register_used_post_id')) {
    wtn_blocks_register_used_post_id($post_id);
}

$heading_tag = function_exists('wtn_blocks_get_next_editorial_heading_tag')
    ? wtn_blocks_get_next_editorial_heading_tag()
    : 'h2';

$heading_tag = function_exists('wtn_blocks_sanitize_heading_tag')
    ? wtn_blocks_sanitize_heading_tag($heading_tag)
    : $heading_tag;

$heading_tag = tag_escape($heading_tag);

$wrapper_attributes = get_block_wrapper_attributes(
    [
        'class' => 'wtn-blocks-breaking-news',
    ]
);
?>

<section <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            ?>>
    <div class="wtn-blocks-breaking-news__inner">
        <div class="wtn-blocks-breaking-news__badge">
            <span
                class="wtn-blocks-breaking-news__icon"
                aria-hidden="true">
                ⚡
            </span>

            <span class="wtn-blocks-breaking-news__label">
                <?php echo esc_html($label); ?>
            </span>
        </div>

        <a
            class="wtn-blocks-breaking-news__link"
            href="<?php echo esc_url($permalink); ?>">
            <<?php echo esc_html($heading_tag); ?> class="wtn-blocks-breaking-news__headline">
                <?php echo esc_html($title); ?>
            </<?php echo esc_html($heading_tag); ?>>

            <?php if ('' !== $time_label) : ?>
                <time
                    class="wtn-blocks-breaking-news__time"
                    datetime="<?php echo esc_attr(get_post_time(DATE_W3C, true, $post)); ?>">
                    <?php echo esc_html($time_label); ?>
                </time>
            <?php endif; ?>

            <span
                class="wtn-blocks-breaking-news__cta"
                aria-hidden="true">
                ›
            </span>
        </a>
    </div>
</section>
