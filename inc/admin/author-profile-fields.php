<?php

/**
 * Author profile admin fields.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Renders the editorial fields in the WordPress user profile screen.
 */
function wtn_blocks_render_author_profile_fields(WP_User $user): void
{
    $author_id = (int) $user->ID;
    $photo_id = wtn_get_author_photo_id($author_id);
    $photo_preview = 0 !== $photo_id
        ? wp_get_attachment_image(
            $photo_id,
            'thumbnail',
            false,
            ['class' => 'wtn-media-field__image']
        )
        : '';
    $editorial_role = wtn_get_author_editorial_role_label($author_id);
    $can_manage_verified = current_user_can('edit_users');
?>

    <h2><?php esc_html_e('Informações editoriais do autor', 'wordpress-template-news-blocks'); ?></h2>

    <?php wp_nonce_field('wtn_save_author_profile_fields', 'wtn_author_profile_fields_nonce'); ?>

    <table class="form-table" role="presentation">
        <?php if ($can_manage_verified) : ?>
            <tr>
                <th scope="row">
                    <?php esc_html_e('Autor verificado', 'wordpress-template-news-blocks'); ?>
                </th>
                <td>
                    <label>
                        <input
                            type="checkbox"
                            name="wtn_author_verified"
                            value="1"
                            <?php checked(wtn_is_author_verified($author_id)); ?>>
                        <?php esc_html_e('Exibir badge de verificação para este autor.', 'wordpress-template-news-blocks'); ?>
                    </label>
                </td>
            </tr>
        <?php endif; ?>

        <tr>
            <th scope="row">
                <label for="wtn-author-photo-id">
                    <?php esc_html_e('Foto do autor', 'wordpress-template-news-blocks'); ?>
                </label>
            </th>
            <td>
                <div
                    class="wtn-media-field"
                    data-wtn-media-field
                    data-title="<?php echo esc_attr__('Selecionar foto do autor', 'wordpress-template-news-blocks'); ?>"
                    data-button="<?php echo esc_attr__('Usar esta imagem', 'wordpress-template-news-blocks'); ?>">
                    <input
                        id="wtn-author-photo-id"
                        type="hidden"
                        name="wtn_author_photo_id"
                        value="<?php echo esc_attr((string) $photo_id); ?>"
                        data-wtn-media-field-input>

                    <div class="wtn-media-field__preview" data-wtn-media-field-preview>
                        <?php echo wp_kses_post($photo_preview); ?>
                    </div>

                    <div class="wtn-media-field__actions">
                        <button type="button" class="button" data-wtn-media-field-select>
                            <?php esc_html_e('Selecionar imagem', 'wordpress-template-news-blocks'); ?>
                        </button>

                        <button
                            type="button"
                            class="button"
                            data-wtn-media-field-remove
                            <?php echo 0 === $photo_id ? 'hidden' : ''; ?>>
                            <?php esc_html_e('Remover imagem', 'wordpress-template-news-blocks'); ?>
                        </button>
                    </div>
                </div>

                <p class="description">
                    <?php esc_html_e('Foto editorial usada pelos componentes de autor do produto.', 'wordpress-template-news-blocks'); ?>
                </p>
            </td>
        </tr>

        <tr>
            <th scope="row">
                <label for="wtn-author-editorial-role">
                    <?php esc_html_e('Cargo editorial', 'wordpress-template-news-blocks'); ?>
                </label>
            </th>
            <td>
                <input
                    id="wtn-author-editorial-role"
                    type="text"
                    name="wtn_author_editorial_role"
                    value="<?php echo esc_attr($editorial_role); ?>"
                    class="regular-text"
                    maxlength="120">

                <p class="description">
                    <?php esc_html_e('Cargo editorial curto, como “Editor de Economia” ou “Colunista de Política”.', 'wordpress-template-news-blocks'); ?>
                </p>
            </td>
        </tr>

        <tr>
            <th scope="row">
                <label for="wtn-author-mini-bio">
                    <?php esc_html_e('Mini bio', 'wordpress-template-news-blocks'); ?>
                </label>
            </th>
            <td>
                <textarea
                    id="wtn-author-mini-bio"
                    name="wtn_author_mini_bio"
                    rows="4"
                    class="regular-text"><?php echo esc_textarea(wtn_get_author_mini_bio($author_id)); ?></textarea>

                <p class="description">
                    <?php esc_html_e('Resumo editorial curto do autor.', 'wordpress-template-news-blocks'); ?>
                </p>
            </td>
        </tr>

        <tr>
            <th scope="row">
                <label for="wtn-author-social-x-url">
                    <?php esc_html_e('URL do X', 'wordpress-template-news-blocks'); ?>
                </label>
            </th>
            <td>
                <input
                    id="wtn-author-social-x-url"
                    type="url"
                    name="wtn_author_social_x_url"
                    value="<?php echo esc_url(get_user_meta($author_id, WTN_AUTHOR_META_SOCIAL_X_URL, true)); ?>"
                    class="regular-text">
            </td>
        </tr>

        <tr>
            <th scope="row">
                <label for="wtn-author-social-instagram-url">
                    <?php esc_html_e('URL do Instagram', 'wordpress-template-news-blocks'); ?>
                </label>
            </th>
            <td>
                <input
                    id="wtn-author-social-instagram-url"
                    type="url"
                    name="wtn_author_social_instagram_url"
                    value="<?php echo esc_url(get_user_meta($author_id, WTN_AUTHOR_META_SOCIAL_INSTAGRAM_URL, true)); ?>"
                    class="regular-text">
            </td>
        </tr>

        <tr>
            <th scope="row">
                <label for="wtn-author-social-linkedin-url">
                    <?php esc_html_e('URL do LinkedIn', 'wordpress-template-news-blocks'); ?>
                </label>
            </th>
            <td>
                <input
                    id="wtn-author-social-linkedin-url"
                    type="url"
                    name="wtn_author_social_linkedin_url"
                    value="<?php echo esc_url(get_user_meta($author_id, WTN_AUTHOR_META_SOCIAL_LINKEDIN_URL, true)); ?>"
                    class="regular-text">
            </td>
        </tr>
    </table>
<?php
}

/**
 * Persists the editorial author profile fields.
 */
function wtn_blocks_save_author_profile_fields(int $user_id): void
{
    if (! current_user_can('edit_user', $user_id)) {
        return;
    }

    $nonce = isset($_POST['wtn_author_profile_fields_nonce'])
        ? sanitize_text_field(wp_unslash($_POST['wtn_author_profile_fields_nonce']))
        : '';

    if (! wp_verify_nonce($nonce, 'wtn_save_author_profile_fields')) {
        return;
    }

    if (current_user_can('edit_users')) {
        $verified = isset($_POST['wtn_author_verified']) ? '1' : '0';
        update_user_meta($user_id, WTN_AUTHOR_META_VERIFIED, $verified);
    }

    $photo_id = isset($_POST['wtn_author_photo_id'])
        ? absint($_POST['wtn_author_photo_id'])
        : 0;

    if (0 === $photo_id) {
        delete_user_meta($user_id, WTN_AUTHOR_META_PHOTO_ID);
    } elseif (
        wtn_blocks_is_accessible_image_attachment($photo_id)
        && current_user_can('edit_post', $photo_id)
    ) {
        update_user_meta($user_id, WTN_AUTHOR_META_PHOTO_ID, $photo_id);
    }

    $editorial_role = isset($_POST['wtn_author_editorial_role'])
        ? sanitize_text_field(wp_unslash($_POST['wtn_author_editorial_role']))
        : '';

    if ('' !== $editorial_role) {
        update_user_meta($user_id, WTN_AUTHOR_META_EDITORIAL_ROLE, $editorial_role);
    } else {
        delete_user_meta($user_id, WTN_AUTHOR_META_EDITORIAL_ROLE);
    }

    $mini_bio = isset($_POST['wtn_author_mini_bio'])
        ? sanitize_textarea_field(wp_unslash($_POST['wtn_author_mini_bio']))
        : '';

    if ('' !== $mini_bio) {
        update_user_meta($user_id, WTN_AUTHOR_META_MINI_BIO, $mini_bio);
    } else {
        delete_user_meta($user_id, WTN_AUTHOR_META_MINI_BIO);
    }

    $social_fields = [
        WTN_AUTHOR_META_SOCIAL_X_URL          => 'wtn_author_social_x_url',
        WTN_AUTHOR_META_SOCIAL_INSTAGRAM_URL  => 'wtn_author_social_instagram_url',
        WTN_AUTHOR_META_SOCIAL_LINKEDIN_URL   => 'wtn_author_social_linkedin_url',
    ];

    foreach ($social_fields as $meta_key => $field_name) {
        $url = isset($_POST[$field_name])
            ? esc_url_raw(wp_unslash($_POST[$field_name]))
            : '';

        if ('' !== $url) {
            update_user_meta($user_id, $meta_key, $url);
        } else {
            delete_user_meta($user_id, $meta_key);
        }
    }
}

/**
 * Enqueues the assets used by the editorial author fields.
 */
function wtn_blocks_enqueue_author_profile_admin_assets(string $hook_suffix): void
{
    if (! in_array($hook_suffix, ['profile.php', 'user-edit.php'], true)) {
        return;
    }

    $style_path = WTN_BLOCKS_PATH . 'assets/css/author-profile.css';
    $script_path = WTN_BLOCKS_PATH . 'assets/js/admin/author-profile.js';

    wp_enqueue_media();

    wp_enqueue_style(
        'wtn-blocks-author-profile',
        WTN_BLOCKS_URL . 'assets/css/author-profile.css',
        [],
        is_file($style_path) ? (string) filemtime($style_path) : null
    );

    wp_enqueue_script(
        'wtn-blocks-author-profile',
        WTN_BLOCKS_URL . 'assets/js/admin/author-profile.js',
        [],
        is_file($script_path) ? (string) filemtime($script_path) : null,
        true
    );
}
