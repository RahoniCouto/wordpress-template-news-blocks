/**
 * Reusable WordPress media field.
 */

( function () {
	const fields = document.querySelectorAll( '[data-wtn-media-field]' );

	if ( ! fields.length || typeof wp === 'undefined' || ! wp.media ) {
		return;
	}

	fields.forEach( ( field ) => {
		const input = field.querySelector( '[data-wtn-media-field-input]' );
		const preview = field.querySelector( '[data-wtn-media-field-preview]' );
		const selectButton = field.querySelector(
			'[data-wtn-media-field-select]'
		);
		const removeButton = field.querySelector(
			'[data-wtn-media-field-remove]'
		);

		if ( ! input || ! preview || ! selectButton || ! removeButton ) {
			return;
		}

		let frame = null;

		selectButton.addEventListener( 'click', () => {
			if ( frame ) {
				frame.open();
				return;
			}

			frame = wp.media( {
				title: field.dataset.title || 'Selecionar imagem',
				button: {
					text: field.dataset.button || 'Usar esta imagem',
				},
				multiple: false,
				library: {
					type: 'image',
				},
			} );

			frame.on( 'select', () => {
				const attachment = frame.state().get( 'selection' ).first();

				if ( ! attachment ) {
					return;
				}

				const image = attachment.toJSON();
				const previewUrl =
					image.sizes?.thumbnail?.url || image.url || '';

				input.value = image.id || '';

				if ( previewUrl ) {
					const previewImage = document.createElement( 'img' );

					previewImage.className = 'wtn-media-field__image';
					previewImage.src = previewUrl;
					previewImage.alt = '';

					preview.replaceChildren( previewImage );
				}

				removeButton.hidden = false;
			} );

			frame.open();
		} );

		removeButton.addEventListener( 'click', () => {
			input.value = '';
			preview.replaceChildren();
			removeButton.hidden = true;
		} );
	} );
} )();
