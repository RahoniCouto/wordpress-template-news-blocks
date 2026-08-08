import { Button, Notice } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

import PostPicker from '../post-picker';

import './editor.scss';

function getPostTitle( post ) {
	if ( ! post?.title?.rendered ) {
		return __( 'Matéria não definida', 'wordpress-template-news-blocks' );
	}

	return decodeEntities( post.title.rendered );
}

export default function EditorialPostSlotControl( {
	label,
	selectionMode,
	configuredPostId = 0,
	resolvedPostId = 0,
	resolvedPost = null,
	source = 'automatic',
	categoryId = 0,
	excludePostIds = [],
	onChange,
} ) {
	const [ isReplacing, setIsReplacing ] = useState( false );

	const normalizedConfiguredPostId = Number( configuredPostId ) || 0;
	const normalizedResolvedPostId = Number( resolvedPostId ) || 0;

	const hasConfiguredPost = normalizedConfiguredPostId > 0;

	const hasInvalidConfiguredPost =
		hasConfiguredPost &&
		( source !== 'manual' ||
			normalizedResolvedPostId !== normalizedConfiguredPostId );

	if ( selectionMode === 'manual' ) {
		return (
			<div className="wtn-blocks-editorial-post-slot">
				<PostPicker
					label={ label }
					value={ normalizedConfiguredPostId }
					categoryId={ categoryId }
					excludePostIds={ excludePostIds }
					onChange={ onChange }
					help={ __(
						'Selecione a matéria que ocupará este slot.',
						'wordpress-template-news-blocks'
					) }
				/>

				{ hasInvalidConfiguredPost && (
					<Notice status="warning" isDismissible={ false }>
						{ __(
							'A matéria configurada neste slot não está disponível para o contexto atual.',
							'wordpress-template-news-blocks'
						) }
					</Notice>
				) }
			</div>
		);
	}

	return (
		<div className="wtn-blocks-editorial-post-slot">
			<div className="wtn-blocks-editorial-post-slot__heading">
				<strong>{ label }</strong>

				<span className="wtn-blocks-editorial-post-slot__source">
					{ source === 'manual'
						? __(
								'Substituição manual',
								'wordpress-template-news-blocks'
						  )
						: __( 'Automática', 'wordpress-template-news-blocks' ) }
				</span>
			</div>

			<p className="wtn-blocks-editorial-post-slot__title">
				{ resolvedPost
					? getPostTitle( resolvedPost )
					: __(
							'Nenhuma matéria disponível',
							'wordpress-template-news-blocks'
					  ) }
			</p>

			{ hasInvalidConfiguredPost && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'A substituição configurada não é válida para o contexto atual. O slot está usando uma matéria automática.',
						'wordpress-template-news-blocks'
					) }
				</Notice>
			) }

			{ hasConfiguredPost ? (
				<div className="wtn-blocks-editorial-post-slot__actions">
					<PostPicker
						label={ __(
							'Alterar substituição',
							'wordpress-template-news-blocks'
						) }
						value={ normalizedConfiguredPostId }
						categoryId={ categoryId }
						excludePostIds={ excludePostIds }
						onChange={ onChange }
						help={ __(
							'Escolha outra matéria ou remova a substituição para voltar ao conteúdo automático.',
							'wordpress-template-news-blocks'
						) }
					/>

					<Button
						variant="secondary"
						onClick={ () => {
							onChange( 0 );
							setIsReplacing( false );
						} }
					>
						{ __(
							'Voltar ao automático',
							'wordpress-template-news-blocks'
						) }
					</Button>
				</div>
			) : (
				<div className="wtn-blocks-editorial-post-slot__actions">
					{ isReplacing ? (
						<>
							<PostPicker
								label={ __(
									'Substituir matéria',
									'wordpress-template-news-blocks'
								) }
								value={ 0 }
								categoryId={ categoryId }
								excludePostIds={ excludePostIds }
								onChange={ ( nextPostId ) => {
									onChange( nextPostId );

									if ( nextPostId > 0 ) {
										setIsReplacing( false );
									}
								} }
								help={ __(
									'Escolha uma matéria para substituir o conteúdo automático deste slot.',
									'wordpress-template-news-blocks'
								) }
							/>

							<Button
								variant="tertiary"
								onClick={ () => {
									setIsReplacing( false );
								} }
							>
								{ __(
									'Cancelar substituição',
									'wordpress-template-news-blocks'
								) }
							</Button>
						</>
					) : (
						<Button
							variant="secondary"
							onClick={ () => {
								setIsReplacing( true );
							} }
						>
							{ __(
								'Substituir matéria',
								'wordpress-template-news-blocks'
							) }
						</Button>
					) }
				</div>
			) }
		</div>
	);
}
