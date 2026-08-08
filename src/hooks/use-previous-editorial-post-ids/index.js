import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

function flattenBlocks( blocks ) {
	const flattenedBlocks = [];

	blocks.forEach( ( block ) => {
		flattenedBlocks.push( block );

		if ( block.innerBlocks?.length ) {
			flattenedBlocks.push( ...flattenBlocks( block.innerBlocks ) );
		}
	} );

	return flattenedBlocks;
}

function getNewsSectionPostIds( block ) {
	const resolvedPostIds = Array.from(
		{ length: 4 },
		( _, slotIndex ) =>
			Number( block.attributes?.resolvedPostIds?.[ slotIndex ] ) || 0
	);

	/*
	 * A News Section sem matéria principal não será renderizada no frontend.
	 * Portanto, não deve consumir suas matérias secundárias no contexto
	 * editorial do editor.
	 */
	if ( resolvedPostIds[ 0 ] <= 0 ) {
		return [];
	}

	return [ ...new Set( resolvedPostIds.filter( ( postId ) => postId > 0 ) ) ];
}

function getEditorialPostIds( block ) {
	switch ( block.name ) {
		case 'wtn-blocks/editorial-hero':
		case 'wtn-blocks/breaking-news': {
			const postId = Number( block.attributes?.postId ) || 0;

			return postId > 0 ? [ postId ] : [];
		}

		case 'wtn-blocks/news-section':
			return getNewsSectionPostIds( block );

		default:
			return [];
	}
}

export default function usePreviousEditorialPostIds( clientId ) {
	return useSelect(
		( select ) => {
			const blocks = select( blockEditorStore ).getBlocks();
			const flattenedBlocks = flattenBlocks( blocks );

			const currentBlockIndex = flattenedBlocks.findIndex(
				( block ) => block.clientId === clientId
			);

			if ( currentBlockIndex <= 0 ) {
				return [];
			}

			const previousPostIds = flattenedBlocks
				.slice( 0, currentBlockIndex )
				.flatMap( getEditorialPostIds )
				.filter( ( postId ) => postId > 0 );

			return [ ...new Set( previousPostIds ) ];
		},
		[ clientId ]
	);
}
