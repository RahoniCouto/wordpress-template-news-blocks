import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	Notice,
	PanelBody,
	Placeholder,
	RadioControl,
	SelectControl,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

const AD_TYPES = [ 'manual', 'adsense' ];
const AD_PLACEMENTS = [ 'horizontal', 'rectangle' ];
const ALLOWED_MEDIA_TYPES = [ 'image' ];

const AD_FORMATS = {
	horizontal: [
		{
			value: 'mobile-banner',
			label: __(
				'Banner mobile — 320 × 50',
				'wordpress-template-news-blocks'
			),
			size: '320 × 50',
		},
		{
			value: 'large-mobile-banner',
			label: __(
				'Banner mobile grande — 320 × 100',
				'wordpress-template-news-blocks'
			),
			size: '320 × 100',
		},
		{
			value: 'leaderboard',
			label: __(
				'Leaderboard — 728 × 90',
				'wordpress-template-news-blocks'
			),
			size: '728 × 90',
		},
		{
			value: 'super-leaderboard',
			label: __(
				'Super Leaderboard — 970 × 90',
				'wordpress-template-news-blocks'
			),
			size: '970 × 90',
		},
		{
			value: 'billboard',
			label: __(
				'Billboard — 970 × 250',
				'wordpress-template-news-blocks'
			),
			size: '970 × 250',
		},
	],
	rectangle: [
		{
			value: 'medium-rectangle',
			label: __(
				'Retângulo médio — 300 × 250',
				'wordpress-template-news-blocks'
			),
			size: '300 × 250',
		},
	],
};

const DEFAULT_AD_FORMATS = {
	horizontal: 'leaderboard',
	rectangle: 'medium-rectangle',
};

function getMediaImageUrl( media ) {
	return (
		media?.media_details?.sizes?.large?.source_url ||
		media?.media_details?.sizes?.medium_large?.source_url ||
		media?.media_details?.sizes?.medium?.source_url ||
		media?.source_url ||
		''
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		type = 'manual',
		placement = 'horizontal',
		format = 'leaderboard',
		imageId = 0,
		url = '',
		adSlotId = '',
	} = attributes;

	const normalizedType = AD_TYPES.includes( type ) ? type : 'manual';

	const normalizedPlacement = AD_PLACEMENTS.includes( placement )
		? placement
		: 'horizontal';

	const formatOptions = AD_FORMATS[ normalizedPlacement ];

	const normalizedFormat = formatOptions.some(
		( formatOption ) => formatOption.value === format
	)
		? format
		: DEFAULT_AD_FORMATS[ normalizedPlacement ];

	const selectedFormat =
		formatOptions.find(
			( formatOption ) => formatOption.value === normalizedFormat
		) || formatOptions[ 0 ];

	const normalizedImageId = Number( imageId ) || 0;

	const normalizedUrl = typeof url === 'string' ? url : '';

	const normalizedAdSlotId =
		typeof adSlotId === 'string' ? adSlotId.trim() : '';

	const hasValidAdSlotId = /^[0-9]+$/.test( normalizedAdSlotId );

	const adsenseConfigured = useSelect( ( select ) => {
		const editorSettings = select( blockEditorStore ).getSettings();

		return Boolean( editorSettings?.wtnBlocks?.adsenseConfigured );
	}, [] );

	const { media, isResolvingMedia } = useSelect(
		( select ) => {
			if ( normalizedImageId <= 0 ) {
				return {
					media: null,
					isResolvingMedia: false,
				};
			}

			const core = select( coreStore );

			return {
				media: core.getEntityRecord(
					'root',
					'media',
					normalizedImageId
				),
				isResolvingMedia: core.isResolving( 'getEntityRecord', [
					'root',
					'media',
					normalizedImageId,
				] ),
			};
		},
		[ normalizedImageId ]
	);

	const imageUrl = getMediaImageUrl( media );

	const imageAlt = typeof media?.alt_text === 'string' ? media.alt_text : '';

	const hasManualImage = normalizedImageId > 0 && Boolean( imageUrl );

	const blockProps = useBlockProps( {
		className: [
			'wtn-blocks-ad-slot',
			`wtn-blocks-ad-slot--${ normalizedType }`,
			`wtn-blocks-ad-slot--${ normalizedPlacement }`,
			`wtn-blocks-ad-slot--format-${ normalizedFormat }`,
		].join( ' ' ),
	} );

	const handleMediaSelect = ( mediaItem ) => {
		setAttributes( {
			imageId: mediaItem?.id ? Number( mediaItem.id ) : 0,
		} );
	};

	let manualPreview;

	if ( isResolvingMedia && normalizedImageId > 0 ) {
		manualPreview = (
			<>
				<span className="wtn-blocks-ad-slot__label">
					{ __( 'Publicidade', 'wordpress-template-news-blocks' ) }
				</span>

				<div className="wtn-blocks-ad-slot__creative">
					<div className="wtn-blocks-ad-slot__editor-loading">
						<Spinner />
					</div>
				</div>
			</>
		);
	} else if ( hasManualImage ) {
		manualPreview = (
			<>
				<span className="wtn-blocks-ad-slot__label">
					{ __( 'Publicidade', 'wordpress-template-news-blocks' ) }
				</span>

				<div className="wtn-blocks-ad-slot__creative">
					<img
						className="wtn-blocks-ad-slot__image"
						src={ imageUrl }
						alt={ imageAlt }
					/>
				</div>

				{ ! imageAlt && (
					<Notice
						className="wtn-blocks-ad-slot__alt-notice"
						status="warning"
						isDismissible={ false }
					>
						{ __(
							'A imagem não possui texto alternativo na Biblioteca de Mídia.',
							'wordpress-template-news-blocks'
						) }
					</Notice>
				) }
			</>
		);
	} else {
		manualPreview = (
			<Placeholder
				icon="megaphone"
				label={ __( 'Ad Slot', 'wordpress-template-news-blocks' ) }
				instructions={ __(
					'Selecione uma imagem para configurar o anúncio manual.',
					'wordpress-template-news-blocks'
				) }
			>
				<MediaUploadCheck>
					<MediaUpload
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						value={ normalizedImageId }
						onSelect={ handleMediaSelect }
						render={ ( { open } ) => (
							<Button variant="primary" onClick={ open }>
								{ __(
									'Selecionar imagem',
									'wordpress-template-news-blocks'
								) }
							</Button>
						) }
					/>
				</MediaUploadCheck>
			</Placeholder>
		);
	}

	let adsensePreview;

	if ( ! adsenseConfigured ) {
		adsensePreview = (
			<Placeholder
				icon="megaphone"
				label={ __(
					'AdSense não configurado',
					'wordpress-template-news-blocks'
				) }
				instructions={ __(
					'Informe o AdSense Client ID nas configurações do plugin.',
					'wordpress-template-news-blocks'
				) }
			/>
		);
	} else if ( ! hasValidAdSlotId ) {
		adsensePreview = (
			<Placeholder
				icon="megaphone"
				label={ __( 'Ad Slot', 'wordpress-template-news-blocks' ) }
				instructions={ __(
					'Informe um Ad Slot ID válido para configurar a unidade AdSense.',
					'wordpress-template-news-blocks'
				) }
			/>
		);
	} else {
		adsensePreview = (
			<>
				<span className="wtn-blocks-ad-slot__label">
					{ __( 'Publicidade', 'wordpress-template-news-blocks' ) }
				</span>

				<div className="wtn-blocks-ad-slot__creative">
					<div className="wtn-blocks-ad-slot__editor-adsense">
						<strong>
							{ __(
								'Google AdSense',
								'wordpress-template-news-blocks'
							) }
						</strong>

						<span>{ selectedFormat.size }</span>

						<code>
							{ sprintf(
								/* translators: %s: AdSense slot ID. */
								__(
									'Slot %s',
									'wordpress-template-news-blocks'
								),
								normalizedAdSlotId
							) }
						</code>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __(
						'Configuração',
						'wordpress-template-news-blocks'
					) }
				>
					<RadioControl
						label={ __( 'Tipo', 'wordpress-template-news-blocks' ) }
						selected={ normalizedType }
						options={ [
							{
								label: __(
									'Manual',
									'wordpress-template-news-blocks'
								),
								value: 'manual',
							},
							{
								label: __(
									'Google AdSense',
									'wordpress-template-news-blocks'
								),
								value: 'adsense',
							},
						] }
						onChange={ ( nextType ) => {
							if ( AD_TYPES.includes( nextType ) ) {
								setAttributes( {
									type: nextType,
								} );
							}
						} }
					/>

					<RadioControl
						label={ __(
							'Placement',
							'wordpress-template-news-blocks'
						) }
						selected={ normalizedPlacement }
						options={ [
							{
								label: __(
									'Horizontal',
									'wordpress-template-news-blocks'
								),
								value: 'horizontal',
							},
							{
								label: __(
									'Retangular',
									'wordpress-template-news-blocks'
								),
								value: 'rectangle',
							},
						] }
						onChange={ ( nextPlacement ) => {
							if ( ! AD_PLACEMENTS.includes( nextPlacement ) ) {
								return;
							}

							setAttributes( {
								placement: nextPlacement,
								format: DEFAULT_AD_FORMATS[ nextPlacement ],
							} );
						} }
					/>

					<SelectControl
						label={ __(
							'Formato',
							'wordpress-template-news-blocks'
						) }
						value={ normalizedFormat }
						options={ formatOptions.map( ( formatOption ) => ( {
							label: formatOption.label,
							value: formatOption.value,
						} ) ) }
						onChange={ ( nextFormat ) => {
							const isValidFormat = formatOptions.some(
								( formatOption ) =>
									formatOption.value === nextFormat
							);

							if ( isValidFormat ) {
								setAttributes( {
									format: nextFormat,
								} );
							}
						} }
						help={ __(
							'Em containers menores que a dimensão nominal, o formato é reduzido proporcionalmente sem mudar para outro preset.',
							'wordpress-template-news-blocks'
						) }
					/>
				</PanelBody>

				{ normalizedType === 'manual' && (
					<PanelBody
						title={ __(
							'Anúncio manual',
							'wordpress-template-news-blocks'
						) }
						initialOpen
					>
						<MediaUploadCheck>
							<MediaUpload
								allowedTypes={ ALLOWED_MEDIA_TYPES }
								value={ normalizedImageId }
								onSelect={ handleMediaSelect }
								render={ ( { open } ) => (
									<Button
										variant="secondary"
										onClick={ open }
									>
										{ normalizedImageId > 0
											? __(
													'Alterar imagem',
													'wordpress-template-news-blocks'
											  )
											: __(
													'Selecionar imagem',
													'wordpress-template-news-blocks'
											  ) }
									</Button>
								) }
							/>
						</MediaUploadCheck>

						{ normalizedImageId > 0 && (
							<Button
								className="wtn-blocks-ad-slot__remove-image"
								variant="link"
								isDestructive
								onClick={ () => {
									setAttributes( {
										imageId: 0,
									} );
								} }
							>
								{ __(
									'Remover imagem',
									'wordpress-template-news-blocks'
								) }
							</Button>
						) }

						<TextControl
							label={ __(
								'URL',
								'wordpress-template-news-blocks'
							) }
							type="url"
							value={ normalizedUrl }
							onChange={ ( nextUrl ) => {
								setAttributes( {
									url: nextUrl,
								} );
							} }
							help={ __(
								'Opcional. Sem URL, a imagem será exibida sem link.',
								'wordpress-template-news-blocks'
							) }
						/>
					</PanelBody>
				) }

				{ normalizedType === 'adsense' && (
					<PanelBody
						title={ __(
							'Google AdSense',
							'wordpress-template-news-blocks'
						) }
						initialOpen
					>
						{ ! adsenseConfigured && (
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'O AdSense Client ID ainda não está configurado globalmente.',
									'wordpress-template-news-blocks'
								) }
							</Notice>
						) }

						<TextControl
							label={ __(
								'Ad Slot ID',
								'wordpress-template-news-blocks'
							) }
							type="text"
							inputMode="numeric"
							value={ normalizedAdSlotId }
							onChange={ ( nextAdSlotId ) => {
								setAttributes( {
									adSlotId: nextAdSlotId,
								} );
							} }
							help={ __(
								'Informe o ID numérico da unidade criada no Google AdSense.',
								'wordpress-template-news-blocks'
							) }
						/>

						{ normalizedAdSlotId && ! hasValidAdSlotId && (
							<Notice status="error" isDismissible={ false }>
								{ __(
									'O Ad Slot ID deve conter apenas números.',
									'wordpress-template-news-blocks'
								) }
							</Notice>
						) }
					</PanelBody>
				) }
			</InspectorControls>

			<div { ...blockProps }>
				{ normalizedType === 'manual' ? manualPreview : adsensePreview }
			</div>
		</>
	);
}
