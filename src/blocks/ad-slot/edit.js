import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	useBlockProps,
} from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
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
const ALLOWED_MEDIA_TYPES = [ 'image' ];

function normalizeAdSlotFormats( adSlotFormats ) {
	return adSlotFormats &&
		typeof adSlotFormats === 'object' &&
		! Array.isArray( adSlotFormats )
		? adSlotFormats
		: {};
}

function getAdFormatDimensions( formatConfig ) {
	const width = Number( formatConfig?.width ) || 0;
	const height = Number( formatConfig?.height ) || 0;

	if ( width <= 0 || height <= 0 ) {
		return null;
	}

	return {
		width,
		height,
	};
}

function getAdFormatSize( formatConfig ) {
	const dimensions = getAdFormatDimensions( formatConfig );

	if ( ! dimensions ) {
		return '';
	}

	return `${ dimensions.width } × ${ dimensions.height }`;
}

function getMediaImageUrl( media ) {
	return (
		media?.media_details?.sizes?.large?.source_url ||
		media?.media_details?.sizes?.medium_large?.source_url ||
		media?.media_details?.sizes?.medium?.source_url ||
		media?.source_url ||
		''
	);
}

function getMediaDimensions( media ) {
	const width = Number( media?.media_details?.width ) || 0;
	const height = Number( media?.media_details?.height ) || 0;

	if ( width <= 0 || height <= 0 ) {
		return null;
	}

	return {
		width,
		height,
	};
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

	const { adsenseConfigured, adSlotFormats } = useSelect( ( select ) => {
		const editorSettings = select( editorStore ).getEditorSettings();

		return {
			adsenseConfigured: Boolean(
				editorSettings?.wtnBlocks?.adsenseConfigured
			),
			adSlotFormats: normalizeAdSlotFormats(
				editorSettings?.wtnBlocks?.adSlotFormats
			),
		};
	}, [] );

	const normalizedType = AD_TYPES.includes( type ) ? type : 'manual';

	const placementEntries = Object.entries( adSlotFormats );

	const fallbackPlacement =
		placementEntries.find(
			( [ placementValue ] ) => placementValue === 'horizontal'
		)?.[ 0 ] ||
		placementEntries[ 0 ]?.[ 0 ] ||
		'';

	const normalizedPlacement = adSlotFormats[ placement ]
		? placement
		: fallbackPlacement;

	const placementConfig = adSlotFormats[ normalizedPlacement ] || {};

	const placementFormats = normalizeAdSlotFormats( placementConfig.formats );

	const formatEntries = Object.entries( placementFormats );

	const configuredDefaultFormat =
		typeof placementConfig.defaultFormat === 'string'
			? placementConfig.defaultFormat
			: '';

	const defaultFormat = placementFormats[ configuredDefaultFormat ]
		? configuredDefaultFormat
		: formatEntries[ 0 ]?.[ 0 ] || '';

	const normalizedFormat = placementFormats[ format ]
		? format
		: defaultFormat;

	const selectedFormat = placementFormats[ normalizedFormat ] || null;

	const selectedFormatDimensions = getAdFormatDimensions( selectedFormat );

	const placementOptions = placementEntries.map(
		( [ placementValue, placementData ] ) => ( {
			value: placementValue,
			label:
				typeof placementData?.label === 'string'
					? placementData.label
					: placementValue,
		} )
	);

	const formatOptions = formatEntries.map(
		( [ formatValue, formatData ] ) => {
			const formatLabel =
				typeof formatData?.label === 'string'
					? formatData.label
					: formatValue;

			const formatSize = getAdFormatSize( formatData );

			return {
				value: formatValue,
				label: formatSize
					? `${ formatLabel } — ${ formatSize }`
					: formatLabel,
			};
		}
	);

	const selectedFormatSize = getAdFormatSize( selectedFormat );

	const hasAdSlotFormats =
		Boolean( normalizedPlacement ) &&
		Boolean( normalizedFormat ) &&
		Boolean( selectedFormatDimensions );

	const normalizedImageId = Number( imageId ) || 0;

	const normalizedUrl = typeof url === 'string' ? url : '';

	const normalizedAdSlotId =
		typeof adSlotId === 'string' ? adSlotId.trim() : '';

	const hasValidAdSlotId = /^[0-9]+$/.test( normalizedAdSlotId );

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
					'postType',
					'attachment',
					normalizedImageId
				),
				isResolvingMedia: core.isResolving( 'getEntityRecord', [
					'postType',
					'attachment',
					normalizedImageId,
				] ),
			};
		},
		[ normalizedImageId ]
	);

	const imageUrl = getMediaImageUrl( media );

	const imageAlt = typeof media?.alt_text === 'string' ? media.alt_text : '';

	const mediaDimensions = getMediaDimensions( media );

	const hasManualImage = normalizedImageId > 0 && Boolean( imageUrl );

	const hasInvalidCreativeDimensions =
		Boolean( mediaDimensions ) &&
		Boolean( selectedFormatDimensions ) &&
		( mediaDimensions.width !== selectedFormatDimensions.width ||
			mediaDimensions.height !== selectedFormatDimensions.height );

	const creativeStyle = selectedFormatDimensions
		? {
				'--wtn-ad-slot-creative-max-inline-size': `${ selectedFormatDimensions.width }px`,
				'--wtn-ad-slot-creative-aspect-ratio': `${ selectedFormatDimensions.width } / ${ selectedFormatDimensions.height }`,
		  }
		: undefined;

	const blockProps = useBlockProps( {
		className: [
			'wtn-blocks-ad-slot',
			`wtn-blocks-ad-slot--${ normalizedType }`,
		].join( ' ' ),
		style: creativeStyle,
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

				{ ( hasInvalidCreativeDimensions || ! imageAlt ) && (
					<div className="wtn-blocks-ad-slot__notices">
						{ hasInvalidCreativeDimensions && (
							<Notice
								className="wtn-blocks-ad-slot__dimensions-notice"
								status="warning"
								isDismissible={ false }
							>
								{ sprintf(
									/* translators: 1: image width, 2: image height, 3: required width, 4: required height. */
									__(
										'Dimensões incompatíveis. A imagem possui %1$d × %2$d px, mas o formato selecionado exige %3$d × %4$d px. Substitua a imagem para garantir a exibição correta do anúncio e evitar transferência desnecessária.',
										'wordpress-template-news-blocks'
									),
									mediaDimensions.width,
									mediaDimensions.height,
									selectedFormatDimensions.width,
									selectedFormatDimensions.height
								) }
							</Notice>
						) }

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
					</div>
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

						{ selectedFormatSize && (
							<span>{ selectedFormatSize }</span>
						) }

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
					{ ! hasAdSlotFormats && (
						<Notice status="error" isDismissible={ false }>
							{ __(
								'Os formatos de publicidade não estão disponíveis no editor.',
								'wordpress-template-news-blocks'
							) }
						</Notice>
					) }

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
						disabled={ ! hasAdSlotFormats }
						options={ placementOptions }
						onChange={ ( nextPlacement ) => {
							const nextPlacementConfig =
								adSlotFormats[ nextPlacement ];

							if ( ! nextPlacementConfig ) {
								return;
							}

							const nextPlacementFormats = normalizeAdSlotFormats(
								nextPlacementConfig.formats
							);

							const nextDefaultFormat =
								typeof nextPlacementConfig.defaultFormat ===
									'string' &&
								nextPlacementFormats[
									nextPlacementConfig.defaultFormat
								]
									? nextPlacementConfig.defaultFormat
									: Object.keys(
											nextPlacementFormats
									  )[ 0 ] || '';

							if ( ! nextDefaultFormat ) {
								return;
							}

							setAttributes( {
								placement: nextPlacement,
								format: nextDefaultFormat,
							} );
						} }
					/>

					<SelectControl
						label={ __(
							'Formato',
							'wordpress-template-news-blocks'
						) }
						value={ normalizedFormat }
						disabled={ ! hasAdSlotFormats }
						options={ formatOptions }
						onChange={ ( nextFormat ) => {
							if ( ! placementFormats[ nextFormat ] ) {
								return;
							}

							setAttributes( {
								format: nextFormat,
							} );
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
						{ selectedFormatSize && (
							<Notice
								className="wtn-blocks-ad-slot__requirement-notice"
								status="info"
								isDismissible={ false }
							>
								{ sprintf(
									/* translators: %s: required advertisement image dimensions. */
									__(
										'Use uma imagem com exatamente %s px para o formato selecionado.',
										'wordpress-template-news-blocks'
									),
									selectedFormatSize
								) }
							</Notice>
						) }

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
