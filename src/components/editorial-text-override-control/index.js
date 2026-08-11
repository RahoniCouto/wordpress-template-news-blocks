import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import { sanitizeEditorialText } from '../../utils/editorial-post-overrides';

import './editor.scss';

export default function EditorialTextOverrideControl( {
	tagName = 'div',
	value = '',
	fallbackValue = '',
	onChange,
	className = '',
	placeholder,
} ) {
	const normalizedValue = typeof value === 'string' ? value : '';

	const normalizedFallbackValue =
		typeof fallbackValue === 'string' ? fallbackValue : '';

	const previewValue = normalizedValue.trim() || normalizedFallbackValue;

	return (
		<RichText
			tagName={ tagName }
			className={ [
				'wtn-blocks-editorial-text-override-control',
				className,
			]
				.filter( Boolean )
				.join( ' ' ) }
			value={ previewValue }
			onChange={ ( nextValue ) => {
				onChange( sanitizeEditorialText( nextValue ) );
			} }
			allowedFormats={ [] }
			disableLineBreaks
			placeholder={
				placeholder ||
				__(
					'Escreva o conteúdo editorial',
					'wordpress-template-news-blocks'
				)
			}
		/>
	);
}
