<?php

/**
 * Ad Slot format registry.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Returns the canonical Ad Slot format registry.
 *
 * @return array<string, array<string, mixed>>
 */
function wtn_blocks_get_ad_slot_formats(): array
{
    return [
        'horizontal' => [
            'label'         => __(
                'Horizontal',
                'wordpress-template-news-blocks'
            ),
            'defaultFormat' => 'leaderboard',
            'formats'       => [
                'mobile-banner' => [
                    'label'  => __(
                        'Banner mobile',
                        'wordpress-template-news-blocks'
                    ),
                    'width'  => 320,
                    'height' => 50,
                ],
                'large-mobile-banner' => [
                    'label'  => __(
                        'Banner mobile grande',
                        'wordpress-template-news-blocks'
                    ),
                    'width'  => 320,
                    'height' => 100,
                ],
                'leaderboard' => [
                    'label'  => __(
                        'Leaderboard',
                        'wordpress-template-news-blocks'
                    ),
                    'width'  => 728,
                    'height' => 90,
                ],
                'super-leaderboard' => [
                    'label'  => __(
                        'Super Leaderboard',
                        'wordpress-template-news-blocks'
                    ),
                    'width'  => 970,
                    'height' => 90,
                ],
                'billboard' => [
                    'label'  => __(
                        'Billboard',
                        'wordpress-template-news-blocks'
                    ),
                    'width'  => 970,
                    'height' => 250,
                ],
            ],
        ],
        'rectangle' => [
            'label'         => __(
                'Retangular',
                'wordpress-template-news-blocks'
            ),
            'defaultFormat' => 'medium-rectangle',
            'formats'       => [
                'medium-rectangle' => [
                    'label'  => __(
                        'Retângulo médio',
                        'wordpress-template-news-blocks'
                    ),
                    'width'  => 300,
                    'height' => 250,
                ],
            ],
        ],
    ];
}
