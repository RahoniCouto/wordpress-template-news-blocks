<?php

/**
 * Media helpers and image sizes.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Registers image sizes used by the editorial blocks and author profile.
 */
function wtn_blocks_register_image_sizes(): void
{
    add_image_size('wtn-featured', 1280, 720, true);
    add_image_size('wtn-card', 768, 432, true);
    add_image_size('wtn-avatar', 192, 192, true);
}

/**
 * Determines whether an image attachment can be used in the current context.
 *
 * Public images are available to visitors. Non-public images are available
 * only when the current user can read the attachment.
 *
 * @param int $attachment_id Attachment ID.
 * @return bool
 */
function wtn_blocks_is_accessible_image_attachment(
    int $attachment_id
): bool {
    $attachment_id = absint($attachment_id);

    if (0 === $attachment_id) {
        return false;
    }

    $attachment = get_post($attachment_id);

    if (
        ! $attachment instanceof WP_Post
        || 'attachment' !== $attachment->post_type
        || ! wp_attachment_is_image($attachment_id)
    ) {
        return false;
    }

    return is_post_publicly_viewable($attachment)
        || current_user_can('read_post', $attachment_id);
}
