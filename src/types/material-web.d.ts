import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-filled-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
        value?: string;
        href?: string;
      };
      'md-outlined-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
        value?: string;
        href?: string;
      };
      'md-text-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
        value?: string;
        href?: string;
      };
      'md-elevated-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
        value?: string;
        href?: string;
      };
      'md-filled-tonal-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
        value?: string;
        href?: string;
      };
      'md-fab': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        variant?: 'surface' | 'primary' | 'secondary' | 'tertiary';
        size?: 'medium' | 'small' | 'large';
        label?: string;
        lowered?: boolean;
      };
      'md-outlined-text-field': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        value?: string;
        placeholder?: string;
        type?: string;
        disabled?: boolean;
        required?: boolean;
        error?: boolean;
        errorText?: string;
        supportingText?: string;
        prefixText?: string;
        suffixText?: string;
        rows?: number;
      };
      'md-filled-text-field': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        value?: string;
        placeholder?: string;
        type?: string;
        disabled?: boolean;
        required?: boolean;
        error?: boolean;
        errorText?: string;
        supportingText?: string;
        prefixText?: string;
        suffixText?: string;
        rows?: number;
      };
      'md-switch': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        selected?: boolean;
        disabled?: boolean;
        required?: boolean;
        name?: string;
        value?: string;
        icons?: boolean;
        showOnlySelectedIcon?: boolean;
      };
      'md-checkbox': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        checked?: boolean;
        indeterminate?: boolean;
        disabled?: boolean;
        required?: boolean;
        name?: string;
        value?: string;
      };
      'md-dialog': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        open?: boolean;
        type?: 'alert' | 'confirm';
      };
      'md-elevation': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'md-circular-progress': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value?: number;
        indeterminate?: boolean;
        fourColor?: boolean;
      };
      'md-linear-progress': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value?: number;
        buffer?: number;
        indeterminate?: boolean;
        fourColor?: boolean;
      };
      'md-tabs': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        activeTabIndex?: number;
      };
      'md-primary-tab': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        active?: boolean;
      };
      'md-secondary-tab': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        active?: boolean;
      };
      'md-chip-set': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'md-filter-chip': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        selected?: boolean;
        disabled?: boolean;
        elevated?: boolean;
      };
      'md-assist-chip': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        disabled?: boolean;
        elevated?: boolean;
      };
      'md-input-chip': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        selected?: boolean;
        disabled?: boolean;
        elevated?: boolean;
        removable?: boolean;
      };
      'md-suggestion-chip': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        disabled?: boolean;
        elevated?: boolean;
      };
      'md-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'md-outlined-select': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        value?: string;
        disabled?: boolean;
        required?: boolean;
        error?: boolean;
        errorText?: string;
        supportingText?: string;
      };
      'md-filled-select': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        value?: string;
        disabled?: boolean;
        required?: boolean;
        error?: boolean;
        errorText?: string;
        supportingText?: string;
      };
      'md-select-option': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value?: string;
        selected?: boolean;
        headline?: string;
        disabled?: boolean;
      };
    }
  }
}
