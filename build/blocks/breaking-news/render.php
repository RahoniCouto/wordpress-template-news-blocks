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
        'titleOverride' => '',
        'label'         => 'Breaking News',
    ]
);

$post_id = absint($block_attributes['postId']);

if (0 === $post_id) {
    return;
}

$post = get_post($post_id);

if (! $post instanceof WP_Post || 'post' !== $post->post_type || 'publish' !== get_post_status($post)) {
    return;
}

if (
    function_exists('wtn_blocks_is_post_used')
    && wtn_blocks_is_post_used($post_id)
) {
    return;
}

$permalink = get_permalink($post);

if (! $permalink) {
    return;
}

$title = trim(wp_strip_all_tags((string) $block_attributes['titleOverride']));
$label = trim(wp_strip_all_tags((string) $block_attributes['label']));

if ('' === $title) {
    $title = get_the_title($post);
}

if ('' === trim($title)) {
    $title = __('Matéria sem título', 'wordpress-template-news-blocks');
}

if ('' === $label) {
    $label = __('Breaking News', 'wordpress-template-news-blocks');
}

$post_timestamp = (int) get_post_time('U', true, $post);
$current_time   = (int) current_time('timestamp', true);
$time_label     = '';

if ($post_timestamp > 0) {
    $time_label = sprintf(
        __('há %s', 'wordpress-template-news-blocks'),
        human_time_diff($post_timestamp, $current_time)
    );
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
            <span class="wtn-blocks-breaking-news__icon" aria-hidden="true">⚡</span>
            <span class="wtn-blocks-breaking-news__label"><?php echo esc_html($label); ?></span>
        </div>

        <a class="wtn-blocks-breaking-news__link" href="<?php echo esc_url($permalink); ?>">
            <<?php echo $heading_tag; ?> class="wtn-blocks-breaking-news__headline">
                <?php echo esc_html($title); ?>
            </<?php echo $heading_tag; ?>>

            <?php if ('' !== $time_label) : ?>
                <time
                    class="wtn-blocks-breaking-news__time"
                    datetime="<?php echo esc_attr(get_post_time(DATE_W3C, true, $post)); ?>">
                    <?php echo esc_html($time_label); ?>
                </time>
            <?php endif; ?>

            <span class="wtn-blocks-breaking-news__cta" aria-hidden="true">›</span>
        </a>
    </div>
</section>
