<?php

/**
 * News Section block render.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

$block_attributes = wp_parse_args(
    $attributes ?? [],
    [
        'categoryId'           => 0,
        'selectionMode'        => 'automatic',
        'layoutVariant'        => 'featured-media-left',
        'titleOverride'        => '',
        'viewAllLabelOverride' => '',
        'viewAllUrlOverride'   => '',
        'slotPostIds'          => [0, 0, 0, 0],
        'postOverrides'        => [],
    ]
);

$category_id = absint($block_attributes['categoryId']);

$selection_mode = in_array(
    $block_attributes['selectionMode'],
    ['automatic', 'manual'],
    true
)
    ? $block_attributes['selectionMode']
    : 'automatic';

$layout_variant = in_array(
    $block_attributes['layoutVariant'],
    ['featured-media-left', 'featured-media-right'],
    true
)
    ? $block_attributes['layoutVariant']
    : 'featured-media-left';

$slot_post_ids = is_array($block_attributes['slotPostIds'])
    ? array_slice(
        array_pad(
            array_map(
                'absint',
                $block_attributes['slotPostIds']
            ),
            4,
            0
        ),
        0,
        4
    )
    : [0, 0, 0, 0];

$post_overrides = is_array($block_attributes['postOverrides'])
    ? $block_attributes['postOverrides']
    : [];

$resolved_post_ids = wtn_blocks_resolve_news_section_posts(
    $selection_mode,
    $category_id,
    $slot_post_ids
);

$resolved_post_ids = array_slice(
    array_pad(
        array_map(
            'absint',
            $resolved_post_ids
        ),
        4,
        0
    ),
    0,
    4
);

$featured_post_id = $resolved_post_ids[0];

if (0 === $featured_post_id) {
    return;
}

$section_category = null;

if ($category_id > 0) {
    $category = get_term(
        $category_id,
        'category'
    );

    if ($category instanceof WP_Term) {
        $section_category = $category;
    }
}

$title_override = trim(
    wp_strip_all_tags(
        (string) $block_attributes['titleOverride']
    )
);

$section_title = $title_override;

if (
    '' === $section_title
    && $section_category instanceof WP_Term
) {
    $section_title = $section_category->name;
}

$view_all_url_override = trim(
    (string) $block_attributes['viewAllUrlOverride']
);

$view_all_url = '';

if ('' !== $view_all_url_override) {
    $view_all_url = esc_url_raw($view_all_url_override);
} elseif ($section_category instanceof WP_Term) {
    $resolved_category_url = get_term_link($section_category);

    if (! is_wp_error($resolved_category_url)) {
        $view_all_url = $resolved_category_url;
    }
}

$view_all_label = trim(
    wp_strip_all_tags(
        (string) $block_attributes['viewAllLabelOverride']
    )
);

if (
    '' !== $view_all_url
    && '' === $view_all_label
) {
    $view_all_label = __(
        'Ver todas',
        'wordpress-template-news-blocks'
    );
}

$get_post_category = static function (int $post_id) use ($section_category): ?WP_Term {
    if ($section_category instanceof WP_Term) {
        return $section_category;
    }

    $categories = get_the_category($post_id);

    if (
        empty($categories)
        || ! $categories[0] instanceof WP_Term
    ) {
        return null;
    }

    return $categories[0];
};

$get_post_render_data = static function (
    int $post_id,
    bool $is_featured
) use (
    $post_overrides,
    $get_post_category
): ?array {
    $post_id = absint($post_id);

    if (0 === $post_id) {
        return null;
    }

    $post = get_post($post_id);

    if (
        ! $post instanceof WP_Post
        || 'post' !== $post->post_type
        || 'publish' !== get_post_status($post)
    ) {
        return null;
    }

    $permalink = get_permalink($post);

    if (
        ! is_string($permalink)
        || '' === $permalink
    ) {
        return null;
    }

    $post_override = wtn_blocks_get_editorial_post_override(
        $post_overrides,
        $post_id
    );

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

    $excerpt = '';

    if ($is_featured) {
        $excerpt = trim(
            wp_strip_all_tags(
                (string) $post_override['excerptOverride']
            )
        );

        if ('' === $excerpt) {
            $excerpt = trim(
                wp_strip_all_tags(
                    get_the_excerpt($post)
                )
            );
        }
    }

    $image_id = absint(
        $post_override['imageOverrideId'] ?? 0
    );

    if (0 === $image_id) {
        $image_id = (int) get_post_thumbnail_id($post);
    }

    $image_size = $is_featured
        ? (
            has_image_size('wtn-featured')
            ? 'wtn-featured'
            : 'large'
        )
        : (
            has_image_size('wtn-card')
            ? 'wtn-card'
            : 'medium_large'
        );

    $image_html = '';

    if ($image_id > 0) {
        $image_alt = trim(
            wp_strip_all_tags(
                (string) get_post_meta(
                    $image_id,
                    '_wp_attachment_image_alt',
                    true
                )
            )
        );

        if ('' === $image_alt) {
            $image_alt = $title;
        }

        $image_html = wp_get_attachment_image(
            $image_id,
            $image_size,
            false,
            [
                'class'    => $is_featured
                    ? 'wtn-blocks-news-section__featured-image'
                    : 'wtn-blocks-news-section__secondary-image',
                'alt'      => $image_alt,
                'decoding' => 'async',
                'sizes'    => $is_featured
                    ? '(min-width: 782px) 55vw, 100vw'
                    : '(min-width: 782px) 30vw, 36vw',
            ]
        );
    }

    $category = $get_post_category($post_id);
    $category_url = '';

    if ($category instanceof WP_Term) {
        $resolved_category_url = get_term_link($category);

        if (! is_wp_error($resolved_category_url)) {
            $category_url = $resolved_category_url;
        }
    }

    return [
        'id'           => $post_id,
        'permalink'    => $permalink,
        'title'        => $title,
        'excerpt'      => $excerpt,
        'image_html'   => $image_html,
        'category'     => $category,
        'category_url' => $category_url,
        'date'         => get_the_date('', $post),
        'date_w3c'     => get_the_date(DATE_W3C, $post),
        'reading_time' => wtn_blocks_get_reading_time_label($post_id),
    ];
};

$featured_post = $get_post_render_data(
    $featured_post_id,
    true
);

if (null === $featured_post) {
    return;
}

$secondary_posts = [];

foreach (array_slice($resolved_post_ids, 1, 3) as $secondary_post_id) {
    $secondary_post = $get_post_render_data(
        $secondary_post_id,
        false
    );

    if (null === $secondary_post) {
        continue;
    }

    $secondary_posts[] = $secondary_post;
}

$consumed_post_ids = [
    $featured_post['id'],
];

foreach ($secondary_posts as $secondary_post) {
    $consumed_post_ids[] = $secondary_post['id'];
}

wtn_blocks_register_used_post_ids($consumed_post_ids);

if ('' !== $section_title) {
    $section_heading_tag = wtn_blocks_get_next_editorial_heading_tag();
    $section_heading_tag = wtn_blocks_sanitize_heading_tag($section_heading_tag);
    $post_heading_tag = wtn_blocks_get_child_heading_tag($section_heading_tag);
} else {
    $section_heading_tag = '';
    $post_heading_tag = wtn_blocks_get_next_editorial_heading_tag();
}

$post_heading_tag = wtn_blocks_sanitize_heading_tag($post_heading_tag);

$secondary_heading_tag = wtn_blocks_get_child_heading_tag($post_heading_tag);
$secondary_heading_tag = wtn_blocks_sanitize_heading_tag($secondary_heading_tag);

if ('' !== $section_heading_tag) {
    $secondary_heading_tag = $post_heading_tag;
}

$section_heading_tag = '' !== $section_heading_tag
    ? tag_escape($section_heading_tag)
    : '';

$post_heading_tag = tag_escape($post_heading_tag);
$secondary_heading_tag = tag_escape($secondary_heading_tag);

$wrapper_classes = [
    'wtn-blocks-news-section',
    'wtn-blocks-news-section--' . $layout_variant,
];

if ('' === $section_title) {
    $wrapper_classes[] = 'wtn-blocks-news-section--no-title';
}

$wrapper_attributes = get_block_wrapper_attributes(
    [
        'class' => implode(' ', $wrapper_classes),
    ]
);

$featured_card_classes = [
    'wtn-blocks-news-section__featured-card',
];

if ('' === $featured_post['image_html']) {
    $featured_card_classes[] = 'wtn-blocks-news-section__featured-card--no-media';
}

$featured_media_label = sprintf(
    __('Abrir matéria: %s', 'wordpress-template-news-blocks'),
    $featured_post['title']
);

$render_category = static function (
    array $post_data,
    string $class_name
): void {
    if (! $post_data['category'] instanceof WP_Term) {
        return;
    }

    if ('' !== $post_data['category_url']) {
?>
        <a
            class="<?php echo esc_attr($class_name); ?>"
            href="<?php echo esc_url($post_data['category_url']); ?>">
            <?php echo esc_html($post_data['category']->name); ?>
        </a>
    <?php
        return;
    }
    ?>
    <span class="<?php echo esc_attr($class_name); ?>">
        <?php echo esc_html($post_data['category']->name); ?>
    </span>
<?php
};

$render_meta = static function (
    array $post_data,
    string $class_prefix
): void {
?>
    <div class="<?php echo esc_attr($class_prefix . '-meta'); ?>">
        <?php if ('' !== $post_data['date']) : ?>
            <time
                class="<?php echo esc_attr($class_prefix . '-meta-item'); ?>"
                datetime="<?php echo esc_attr($post_data['date_w3c']); ?>">
                <?php echo esc_html($post_data['date']); ?>
            </time>
        <?php endif; ?>

        <?php if ('' !== $post_data['reading_time']) : ?>
            <span class="<?php echo esc_attr($class_prefix . '-meta-item'); ?>">
                <?php echo esc_html($post_data['reading_time']); ?>
            </span>
        <?php endif; ?>
    </div>
<?php
};
?>

<section <?php echo $wrapper_attributes; ?>>
    <?php if ('' !== $section_title || '' !== $view_all_url) : ?>
        <header class="wtn-blocks-news-section__header">
            <?php if ('' !== $section_title) : ?>
                <<?php echo esc_html($section_heading_tag); ?> class="wtn-blocks-news-section__section-title">
                    <?php echo esc_html($section_title); ?>
                </<?php echo esc_html($section_heading_tag); ?>>
            <?php endif; ?>

            <?php if ('' !== $view_all_url) : ?>
                <a
                    class="wtn-blocks-news-section__view-all"
                    href="<?php echo esc_url($view_all_url); ?>">
                    <span class="wtn-blocks-news-section__view-all-label">
                        <?php echo esc_html($view_all_label); ?>
                    </span>

                    <span
                        class="wtn-blocks-news-section__view-all-icon"
                        aria-hidden="true">
                        &rarr;
                    </span>
                </a>
            <?php endif; ?>
        </header>
    <?php endif; ?>

    <article class="<?php echo esc_attr(implode(' ', $featured_card_classes)); ?>">
        <?php if ('' !== $featured_post['image_html']) : ?>
            <a
                class="wtn-blocks-news-section__featured-media"
                href="<?php echo esc_url($featured_post['permalink']); ?>"
                aria-label="<?php echo esc_attr($featured_media_label); ?>">
                <?php echo $featured_post['image_html']; ?>
            </a>
        <?php endif; ?>

        <div class="wtn-blocks-news-section__featured-content">
            <?php
            $render_category(
                $featured_post,
                'wtn-blocks-news-section__featured-category'
            );
            ?>

            <<?php echo esc_html($post_heading_tag); ?> class="wtn-blocks-news-section__featured-title">
                <a href="<?php echo esc_url($featured_post['permalink']); ?>">
                    <?php echo esc_html($featured_post['title']); ?>
                </a>
            </<?php echo esc_html($post_heading_tag); ?>>

            <?php if ('' !== $featured_post['excerpt']) : ?>
                <p class="wtn-blocks-news-section__featured-excerpt">
                    <?php echo esc_html($featured_post['excerpt']); ?>
                </p>
            <?php endif; ?>

            <?php
            $render_meta(
                $featured_post,
                'wtn-blocks-news-section__featured'
            );
            ?>
        </div>
    </article>

    <?php if (! empty($secondary_posts)) : ?>
        <div class="wtn-blocks-news-section__secondary-list">
            <?php foreach ($secondary_posts as $secondary_post) : ?>
                <?php
                $secondary_card_classes = [
                    'wtn-blocks-news-section__secondary-card',
                ];

                if ('' === $secondary_post['image_html']) {
                    $secondary_card_classes[] = 'wtn-blocks-news-section__secondary-card--no-media';
                }

                $secondary_media_label = sprintf(
                    __('Abrir matéria: %s', 'wordpress-template-news-blocks'),
                    $secondary_post['title']
                );
                ?>

                <article class="<?php echo esc_attr(implode(' ', $secondary_card_classes)); ?>">
                    <?php if ('' !== $secondary_post['image_html']) : ?>
                        <a
                            class="wtn-blocks-news-section__secondary-media"
                            href="<?php echo esc_url($secondary_post['permalink']); ?>"
                            aria-label="<?php echo esc_attr($secondary_media_label); ?>">
                            <?php echo $secondary_post['image_html']; ?>
                        </a>
                    <?php endif; ?>

                    <div class="wtn-blocks-news-section__secondary-content">
                        <?php
                        $render_category(
                            $secondary_post,
                            'wtn-blocks-news-section__secondary-category'
                        );
                        ?>

                        <<?php echo esc_html($secondary_heading_tag); ?> class="wtn-blocks-news-section__secondary-title">
                            <a href="<?php echo esc_url($secondary_post['permalink']); ?>">
                                <?php echo esc_html($secondary_post['title']); ?>
                            </a>
                        </<?php echo esc_html($secondary_heading_tag); ?>>

                        <?php
                        $render_meta(
                            $secondary_post,
                            'wtn-blocks-news-section__secondary'
                        );
                        ?>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</section>
