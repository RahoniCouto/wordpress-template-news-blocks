<?php

/**
 * Editorial heading context.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Resets the editorial heading context for the current render pass.
 *
 * @param bool $main_heading_consumed Whether the template already rendered
 *                                    the page's main heading before the_content.
 */
function wtn_blocks_reset_heading_context(bool $main_heading_consumed = false): void
{
    $GLOBALS['wtn_blocks_heading_context'] = [
        'main_heading_consumed' => $main_heading_consumed,
    ];
}

/**
 * Ensures the editorial heading context exists.
 */
function wtn_blocks_ensure_heading_context(): void
{
    if (
        ! isset($GLOBALS['wtn_blocks_heading_context'])
        || ! is_array($GLOBALS['wtn_blocks_heading_context'])
    ) {
        wtn_blocks_reset_heading_context();
    }
}

/**
 * Resets context before WordPress renders block content on the frontend.
 *
 * WordPress runs do_blocks() on the_content before normal paragraph filters,
 * so this reset must happen earlier than block rendering.
 *
 * Singular posts and pages already receive their H1 from the theme template.
 * The static front page is the exception: its template renders block content
 * without a separate page title so the first editorial block may own the H1.
 *
 * @param string $content Post content.
 * @return string
 */
function wtn_blocks_reset_heading_context_before_content(string $content): string
{
    if (! is_admin()) {
        $template_has_main_heading = is_singular(['post', 'page'])
            && ! is_front_page();

        wtn_blocks_reset_heading_context($template_has_main_heading);
    }

    return $content;
}
add_filter('the_content', 'wtn_blocks_reset_heading_context_before_content', 8);

/**
 * Returns the heading tag for the next editorial heading candidate.
 *
 * @return string
 */
function wtn_blocks_get_next_editorial_heading_tag(): string
{
    wtn_blocks_ensure_heading_context();

    if (empty($GLOBALS['wtn_blocks_heading_context']['main_heading_consumed'])) {
        $GLOBALS['wtn_blocks_heading_context']['main_heading_consumed'] = true;

        return 'h1';
    }

    return 'h2';
}

/**
 * Returns a child heading tag one level below a parent editorial heading.
 *
 * @param string $parent_heading_tag Parent heading tag.
 * @return string
 */
function wtn_blocks_get_child_heading_tag(string $parent_heading_tag): string
{
    return 'h1' === $parent_heading_tag ? 'h2' : 'h3';
}

/**
 * Validates heading tags before output.
 *
 * @param string $tag Heading tag.
 * @return string
 */
function wtn_blocks_sanitize_heading_tag(string $tag): string
{
    $allowed_tags = ['h1', 'h2', 'h3'];

    return in_array($tag, $allowed_tags, true) ? $tag : 'h2';
}
