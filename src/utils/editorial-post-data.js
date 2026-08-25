import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

import { sanitizeEditorialText } from './editorial-post-overrides';

export function getEditorialPostTitle( post ) {
	if ( ! post?.title?.rendered ) {
		return __( 'Matéria sem título', 'wordpress-template-news-blocks' );
	}

	return decodeEntities( sanitizeEditorialText( post.title.rendered ) );
}

export function getEditorialPostExcerpt( post ) {
	if ( ! post?.excerpt?.rendered ) {
		return '';
	}

	return decodeEntities( sanitizeEditorialText( post.excerpt.rendered ) );
}
