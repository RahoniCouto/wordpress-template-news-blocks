<?php
/**
 * Editorial Hero block render.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

$block_attributes = wp_parse_args(
    $attributes ?? [],
    [
        'postId'          => 0,
        'titleOverride'   => '',
        'excerptOverride' => '',
        'imageOverrideId' => 0,
        'mediaPosition'   => 'left',
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

$media_position = in_array($block_attributes['mediaPosition'], ['left', 'right'], true)
    ? $block_attributes['mediaPosition']
    : 'left';

$permalink = get_permalink($post);
$title = trim(wp_strip_all_tags((string) $block_attributes['titleOverride']));
$excerpt = trim(wp_strip_all_tags((string) $block_attributes['excerptOverride']));

if ('' === $title) {
    $title = get_the_title($post);
}

if ('' === $excerpt) {
    $excerpt = get_the_excerpt($post);
}

$image_id = absint($block_attributes['imageOverrideId']);

if (0 === $image_id) {
    $image_id = (int) get_post_thumbnail_id($post);
}

$image_size = function_exists('has_image_size') && has_image_size('wtn-featured')
    ? 'wtn-featured'
    : 'large';

$image_html = '';

if ($image_id > 0) {
    $image_html = wp_get_attachment_image(
        $image_id,
        $image_size,
        false,
        [
            'class'         => 'wtn-blocks-editorial-hero__image',
            'loading'       => 'eager',
            'decoding'      => 'async',
            'fetchpriority' => 'high',
            'sizes'         => '(min-width: 1024px) 50vw, 100vw',
        ]
    );
}

$heading_tag = function_exists('wtn_blocks_get_next_editorial_heading_tag')
    ? wtn_blocks_get_next_editorial_heading_tag()
    : 'h2';

$heading_tag = function_exists('wtn_blocks_sanitize_heading_tag')
    ? wtn_blocks_sanitize_heading_tag($heading_tag)
    : $heading_tag;

$heading_tag = tag_escape($heading_tag);

$categories = get_the_category($post_id);
$primary_category = ! empty($categories) ? $categories[0] : null;

$wrapper_classes = [
    'wtn-blocks-editorial-hero',
    'wtn-blocks-editorial-hero--media-' . $media_position,
];

if ('' === $image_html) {
    $wrapper_classes[] = 'wtn-blocks-editorial-hero--no-media';
}

$wrapper_attributes = get_block_wrapper_attributes(
    [
        'class' => implode(' ', $wrapper_classes),
    ]
);
?>

<section <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
    <div class="wtn-blocks-editorial-hero__inner">
        <?php if ('' !== $image_html) : ?>
            <a class="wtn-blocks-editorial-hero__media" href="<?php echo esc_url($permalink); ?>">
                <?php echo $image_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
            </a>
        <?php endif; ?>

        <div class="wtn-blocks-editorial-hero__content">
            <p class="wtn-blocks-editorial-hero__eyebrow">
                <?php esc_html_e('Destaque', 'wordpress-template-news-blocks'); ?>
            </p>

            <<?php echo $heading_tag; ?> class="wtn-blocks-editorial-hero__title">
                <a href="<?php echo esc_url($permalink); ?>">
                    <?php echo esc_html($title); ?>
                </a>
            </<?php echo $heading_tag; ?>>

            <?php if ('' !== $excerpt) : ?>
                <p class="wtn-blocks-editorial-hero__excerpt">
                    <?php echo esc_html($excerpt); ?>
                </p>
            <?php endif; ?>

            <div class="wtn-blocks-editorial-hero__meta">
                <?php if ($primary_category instanceof WP_Term) : ?>
                    <a
                        class="wtn-blocks-editorial-hero__meta-item"
                        href="<?php echo esc_url(get_category_link($primary_category)); ?>"
                    >
                        <?php echo esc_html($primary_category->name); ?>
                    </a>
                <?php endif; ?>

                <time
                    class="wtn-blocks-editorial-hero__meta-item"
                    datetime="<?php echo esc_attr(get_the_date(DATE_W3C, $post)); ?>"
                >
                    <?php echo esc_html(get_the_date('', $post)); ?>
                </time>
            </div>
        </div>
    </div>
</section>