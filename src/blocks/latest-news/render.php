<?php

/**
 * Latest News block render.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

$block_attributes = wp_parse_args(
    $attributes ?? [],
    [
        'categoryId'    => 0,
        'layoutVariant' => 'horizontal',
        'postCount'     => 4,
        'titleOverride' => '',
        'showViewAll'   => false,
        'viewAllUrl'    => '',
        'postOverrides' => [],
    ]
);

$category_id = absint($block_attributes['categoryId']);

$layout_variant = in_array(
    $block_attributes['layoutVariant'],
    ['horizontal', 'vertical'],
    true
)
    ? $block_attributes['layoutVariant']
    : 'horizontal';

$post_count = absint($block_attributes['postCount']);

$post_count = in_array($post_count, [3, 4, 5], true)
    ? $post_count
    : 4;

$post_overrides = is_array($block_attributes['postOverrides'])
    ? $block_attributes['postOverrides']
    : [];

$excluded_post_ids = wtn_blocks_get_used_post_ids();

$resolved_post_ids = wtn_blocks_resolve_latest_news_posts(
    $category_id,
    $post_count,
    $excluded_post_ids
);

$resolved_post_ids = array_slice(
    array_values(
        array_unique(
            array_filter(
                array_map('absint', $resolved_post_ids)
            )
        )
    ),
    0,
    $post_count
);

if (empty($resolved_post_ids)) {
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

if ('' === $section_title) {
    $section_title = $section_category instanceof WP_Term
        ? $section_category->name
        : __(
            'Últimas notícias',
            'wordpress-template-news-blocks'
        );
}

$show_view_all = (bool) $block_attributes['showViewAll'];
$view_all_url  = '';

if ($show_view_all) {
    if ($section_category instanceof WP_Term) {
        $resolved_category_url = get_term_link(
            $section_category
        );

        if (! is_wp_error($resolved_category_url)) {
            $view_all_url = $resolved_category_url;
        }
    } elseif (is_string($block_attributes['viewAllUrl'])) {
        $view_all_url = esc_url_raw(
            trim($block_attributes['viewAllUrl'])
        );
    }
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

$get_post_render_data = static function (int $post_id) use (
    $post_overrides,
    $get_post_category
): ?array {
    $post_data = wtn_blocks_get_editorial_post_data(
        $post_id,
        $post_overrides
    );

    if (null === $post_data) {
        return null;
    }

    $post          = $post_data['post'];
    $post_id       = $post_data['id'];
    $permalink     = $post_data['permalink'];
    $title         = $post_data['title'];
    $post_override = $post_data['post_override'];

    $image_data = wtn_blocks_get_editorial_post_image_data(
        $post,
        $post_override,
        $title
    );

    $image_id  = $image_data['id'];
    $image_alt = $image_data['alt'];

    $image_size = has_image_size('wtn-card')
        ? 'wtn-card'
        : 'medium_large';

    $image_html = '';

    if ($image_id > 0) {
        $image_html = wp_get_attachment_image(
            $image_id,
            $image_size,
            false,
            [
                'class'    => 'wtn-blocks-latest-news__image',
                'alt'      => $image_alt,
                'decoding' => 'async',
            ]
        );
    }

    $category = $get_post_category($post_id);
    $category_url = '';

    if ($category instanceof WP_Term) {
        $resolved_category_url = get_term_link(
            $category
        );

        if (! is_wp_error($resolved_category_url)) {
            $category_url = $resolved_category_url;
        }
    }

    return [
        'id'           => $post_id,
        'permalink'    => $permalink,
        'title'        => $title,
        'image_html'   => $image_html,
        'category'     => $category,
        'category_url' => $category_url,
        'date'         => get_the_date('', $post),
        'date_w3c'     => get_the_date(DATE_W3C, $post),
    ];
};

$resolved_posts = [];

foreach ($resolved_post_ids as $resolved_post_id) {
    $resolved_post = $get_post_render_data(
        $resolved_post_id
    );

    if (null === $resolved_post) {
        continue;
    }

    $resolved_posts[] = $resolved_post;
}

if (empty($resolved_posts)) {
    return;
}

$consumed_post_ids = array_map(
    static fn(array $post_data): int => absint(
        $post_data['id']
    ),
    $resolved_posts
);

wtn_blocks_register_used_post_ids(
    $consumed_post_ids
);

$section_heading_tag = wtn_blocks_get_next_editorial_heading_tag();
$section_heading_tag = wtn_blocks_sanitize_heading_tag(
    $section_heading_tag
);

$post_heading_tag = wtn_blocks_get_child_heading_tag(
    $section_heading_tag
);
$post_heading_tag = wtn_blocks_sanitize_heading_tag(
    $post_heading_tag
);

$section_heading_tag = tag_escape(
    $section_heading_tag
);

$post_heading_tag = tag_escape(
    $post_heading_tag
);

$wrapper_classes = [
    'wtn-blocks-latest-news',
    'wtn-blocks-latest-news--' . $layout_variant,
    'wtn-blocks-latest-news--count-' . $post_count,
];

$wrapper_attributes = get_block_wrapper_attributes(
    [
        'class' => implode(
            ' ',
            $wrapper_classes
        ),
    ]
);

$render_category = static function (array $post_data): void {
    if (! $post_data['category'] instanceof WP_Term) {
        return;
    }

    if ('' !== $post_data['category_url']) {
?>
        <a
            class="wtn-blocks-latest-news__category"
            href="<?php echo esc_url($post_data['category_url']); ?>">
            <?php echo esc_html($post_data['category']->name); ?>
        </a>
    <?php
        return;
    }
    ?>
    <span class="wtn-blocks-latest-news__category">
        <?php echo esc_html($post_data['category']->name); ?>
    </span>
<?php
};
?>

<section <?php echo $wrapper_attributes; ?>>
    <header class="wtn-blocks-latest-news__header">
        <<?php echo esc_html($section_heading_tag); ?> class="wtn-blocks-latest-news__section-title">
            <?php echo esc_html($section_title); ?>
        </<?php echo esc_html($section_heading_tag); ?>>

        <?php if ('' !== $view_all_url) : ?>
            <a
                class="wtn-blocks-latest-news__view-all"
                href="<?php echo esc_url($view_all_url); ?>">
                <?php
                esc_html_e(
                    'Ver todas',
                    'wordpress-template-news-blocks'
                );
                ?>
            </a>
        <?php endif; ?>
    </header>

    <div class="wtn-blocks-latest-news__items">
        <?php foreach ($resolved_posts as $post_data) : ?>
            <?php
            $item_classes = [
                'wtn-blocks-latest-news__item',
            ];

            if ('' === $post_data['image_html']) {
                $item_classes[] = 'wtn-blocks-latest-news__item--no-media';
            }

            $media_label = sprintf(
                __(
                    'Abrir matéria: %s',
                    'wordpress-template-news-blocks'
                ),
                $post_data['title']
            );
            ?>

            <article class="<?php echo esc_attr(implode(' ', $item_classes)); ?>">
                <?php if ('' !== $post_data['image_html']) : ?>
                    <a
                        class="wtn-blocks-latest-news__media"
                        href="<?php echo esc_url($post_data['permalink']); ?>"
                        aria-label="<?php echo esc_attr($media_label); ?>">
                        <?php echo $post_data['image_html']; ?>
                    </a>
                <?php endif; ?>

                <div class="wtn-blocks-latest-news__content">
                    <?php if ('horizontal' === $layout_variant) : ?>
                        <?php $render_category($post_data); ?>
                    <?php endif; ?>

                    <<?php echo esc_html($post_heading_tag); ?> class="wtn-blocks-latest-news__title">
                        <a href="<?php echo esc_url($post_data['permalink']); ?>">
                            <?php echo esc_html($post_data['title']); ?>
                        </a>
                    </<?php echo esc_html($post_heading_tag); ?>>

                    <?php if ('' !== $post_data['date']) : ?>
                        <time
                            class="wtn-blocks-latest-news__date"
                            datetime="<?php echo esc_attr($post_data['date_w3c']); ?>">
                            <?php echo esc_html($post_data['date']); ?>
                        </time>
                    <?php endif; ?>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
</section>
