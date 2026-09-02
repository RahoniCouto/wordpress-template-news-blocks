<?php

/**
 * Media helpers.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
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
