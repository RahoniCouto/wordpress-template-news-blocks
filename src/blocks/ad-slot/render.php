<?php

/**
 * Ad Slot block render.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Block attributes are provided by WordPress when rendering the block.
 *
 * @var array<string, mixed> $attributes
 */
$block_attributes = wp_parse_args(
    $attributes ?? [],
    [
        'type'      => 'manual',
        'placement' => 'horizontal',
        'format'    => 'leaderboard',
        'imageId'   => 0,
        'url'       => '',
        'adSlotId'  => '',
    ]
);

$type = in_array(
    $block_attributes['type'],
    ['manual', 'adsense'],
    true
)
    ? $block_attributes['type']
    : 'manual';

$ad_slot_formats = wtn_blocks_get_ad_slot_formats();

$placement = is_string($block_attributes['placement'])
    && isset($ad_slot_formats[$block_attributes['placement']])
    ? $block_attributes['placement']
    : 'horizontal';

$placement_config = $ad_slot_formats[$placement];

$default_format = $placement_config['defaultFormat'];

$format = is_string($block_attributes['format'])
    && isset(
        $placement_config['formats'][$block_attributes['format']]
    )
    ? $block_attributes['format']
    : $default_format;

$format_config = $placement_config['formats'][$format];

$format_width = absint(
    $format_config['width'] ?? 0
);

$format_height = absint(
    $format_config['height'] ?? 0
);

if (
    0 === $format_width
    || 0 === $format_height
) {
    return;
}

$image_html        = '';
$image_alt         = '';
$url               = '';
$adsense_client_id = '';
$ad_slot_id        = '';

if ('manual' === $type) {
    $image_id = absint(
        $block_attributes['imageId']
    );

    if (
        0 === $image_id
        || ! wtn_blocks_is_accessible_image_attachment($image_id)
    ) {
        return;
    }

    $image_html = wp_get_attachment_image(
        $image_id,
        'full',
        false,
        [
            'class'    => 'wtn-blocks-ad-slot__image',
            'decoding' => 'async',
        ]
    );

    if ('' === $image_html) {
        return;
    }

    $url = is_string($block_attributes['url'])
        ? esc_url_raw(
            trim($block_attributes['url'])
        )
        : '';

    $image_alt = trim(
        (string) get_post_meta(
            $image_id,
            '_wp_attachment_image_alt',
            true
        )
    );
} else {
    $adsense_client_id = wtn_blocks_get_adsense_client_id();

    if (
        ! wtn_blocks_is_valid_adsense_client_id(
            $adsense_client_id
        )
        || ! is_string(
            $block_attributes['adSlotId']
        )
    ) {
        return;
    }

    $ad_slot_id = trim(
        $block_attributes['adSlotId']
    );

    if (
        1 !== preg_match(
            '/^[0-9]+$/',
            $ad_slot_id
        )
    ) {
        return;
    }
}

$wrapper_attributes = get_block_wrapper_attributes(
    [
        'class' => implode(
            ' ',
            [
                'wtn-blocks-ad-slot',
                'wtn-blocks-ad-slot--' . $type,
            ]
        ),
        'style' => sprintf(
            '--wtn-ad-slot-creative-max-inline-size: %dpx; --wtn-ad-slot-creative-aspect-ratio: %d / %d;',
            $format_width,
            $format_width,
            $format_height
        ),
    ]
);
?>

<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        ?>>
    <span class="wtn-blocks-ad-slot__label">
        <?php
        esc_html_e(
            'Publicidade',
            'wordpress-template-news-blocks'
        );
        ?>
    </span>

    <div class="wtn-blocks-ad-slot__creative">
        <?php if ('manual' === $type) : ?>

            <?php if ('' !== $url) : ?>
                <a
                    class="wtn-blocks-ad-slot__link"
                    href="<?php echo esc_url($url); ?>"
                    rel="sponsored"
                    <?php if ('' === $image_alt) : ?>
                    aria-label="<?php esc_attr_e('Publicidade', 'wordpress-template-news-blocks'); ?>"
                    <?php endif; ?>>
                    <?php echo wp_kses_post($image_html); ?>
                </a>
            <?php else : ?>
                <?php echo wp_kses_post($image_html); ?>
            <?php endif; ?>

        <?php else : ?>

            <ins
                class="adsbygoogle wtn-blocks-ad-slot__adsense"
                data-ad-client="<?php echo esc_attr($adsense_client_id); ?>"
                data-ad-slot="<?php echo esc_attr($ad_slot_id); ?>"
                data-ad-format="<?php echo esc_attr($placement); ?>"
                data-full-width-responsive="true"></ins>

            <?php
            wp_print_inline_script_tag(
                'window.adsbygoogle = window.adsbygoogle || []; window.adsbygoogle.push({});'
            );
            ?>

        <?php endif; ?>
    </div>
</div>
