<?php

/**
 * Plugin settings.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Returns the configured AdSense client ID.
 */
function wtn_blocks_get_adsense_client_id(): string
{
    $client_id = get_option(
        'wtn_blocks_adsense_client_id',
        ''
    );

    return is_string($client_id)
        ? trim($client_id)
        : '';
}

/**
 * Checks whether an AdSense client ID is valid.
 *
 * @param string $client_id AdSense client ID.
 */
function wtn_blocks_is_valid_adsense_client_id(
    string $client_id
): bool {
    return 1 === preg_match(
        '/^ca-pub-[0-9]+$/',
        trim($client_id)
    );
}

/**
 * Sanitizes the AdSense client ID setting.
 *
 * @param mixed $value Submitted setting value.
 */
function wtn_blocks_sanitize_adsense_client_id(
    $value
): string {
    $client_id = is_string($value)
        ? trim($value)
        : '';

    if ('' === $client_id) {
        return '';
    }

    if (
        ! wtn_blocks_is_valid_adsense_client_id(
            $client_id
        )
    ) {
        add_settings_error(
            'wtn_blocks_adsense_client_id',
            'wtn_blocks_adsense_client_id_invalid',
            __(
                'Informe um AdSense Client ID válido no formato ca-pub-XXXXXXXXXXXXXXXX.',
                'wordpress-template-news-blocks'
            )
        );

        return wtn_blocks_get_adsense_client_id();
    }

    return $client_id;
}

/**
 * Registers the plugin settings.
 */
function wtn_blocks_register_settings(): void
{
    register_setting(
        'wtn_blocks_settings',
        'wtn_blocks_adsense_client_id',
        [
            'type'              => 'string',
            'sanitize_callback' => 'wtn_blocks_sanitize_adsense_client_id',
            'default'           => '',
        ]
    );

    add_settings_section(
        'wtn_blocks_adsense_settings',
        __(
            'Google AdSense',
            'wordpress-template-news-blocks'
        ),
        'wtn_blocks_render_adsense_settings_section',
        'wtn-blocks-settings'
    );

    add_settings_field(
        'wtn_blocks_adsense_client_id',
        __(
            'AdSense Client ID',
            'wordpress-template-news-blocks'
        ),
        'wtn_blocks_render_adsense_client_id_field',
        'wtn-blocks-settings',
        'wtn_blocks_adsense_settings'
    );
}

/**
 * Renders the AdSense settings section description.
 */
function wtn_blocks_render_adsense_settings_section(): void
{
?>
    <p>
        <?php
        esc_html_e(
            'Configure apenas o Client ID utilizado pelas unidades AdSense dos blocos. O carregamento global do script do AdSense continua sendo responsabilidade do site, do Site Kit ou de outra integração.',
            'wordpress-template-news-blocks'
        );
        ?>
    </p>
<?php
}

/**
 * Renders the AdSense client ID field.
 */
function wtn_blocks_render_adsense_client_id_field(): void
{
    $client_id = wtn_blocks_get_adsense_client_id();
?>

    <input
        type="text"
        id="wtn_blocks_adsense_client_id"
        name="wtn_blocks_adsense_client_id"
        value="<?php echo esc_attr($client_id); ?>"
        class="regular-text code"
        pattern="ca-pub-[0-9]+"
        placeholder="ca-pub-XXXXXXXXXXXXXXXX"
        autocomplete="off"
        spellcheck="false" />

    <p class="description">
        <?php
        esc_html_e(
            'Deixe em branco enquanto o site ainda não possuir uma conta AdSense configurada.',
            'wordpress-template-news-blocks'
        );
        ?>
    </p>

<?php
}

/**
 * Registers the plugin settings page.
 */
function wtn_blocks_register_settings_page(): void
{
    add_options_page(
        __(
            'WordPress Template News Blocks',
            'wordpress-template-news-blocks'
        ),
        __(
            'WordPress Template News Blocks',
            'wordpress-template-news-blocks'
        ),
        'manage_options',
        'wtn-blocks-settings',
        'wtn_blocks_render_settings_page'
    );
}

/**
 * Renders the plugin settings page.
 */
function wtn_blocks_render_settings_page(): void
{
    if (! current_user_can('manage_options')) {
        return;
    }

?>

    <div class="wrap">
        <h1>
            <?php
            esc_html_e(
                'WordPress Template News Blocks',
                'wordpress-template-news-blocks'
            );
            ?>
        </h1>

        <?php settings_errors(); ?>

        <form action="options.php" method="post">
            <?php
            settings_fields('wtn_blocks_settings');
            do_settings_sections('wtn-blocks-settings');
            submit_button();
            ?>
        </form>
    </div>

<?php
}

/**
 * Exposes plugin configuration state to the block editor.
 *
 * The AdSense client ID remains server-side. The editor only
 * receives whether the global configuration is available.
 *
 * @param array<string, mixed> $editor_settings Block editor settings.
 * @return array<string, mixed>
 */
function wtn_blocks_add_block_editor_settings(
    array $editor_settings
): array {
    $client_id = wtn_blocks_get_adsense_client_id();

    $editor_settings['wtnBlocks'] = [
        'adsenseConfigured' => wtn_blocks_is_valid_adsense_client_id(
            $client_id
        ),
    ];

    return $editor_settings;
}
