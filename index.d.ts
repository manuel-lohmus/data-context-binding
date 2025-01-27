
declare module 'data-context-binding' {

    /**
     * Get-Set DOM html root data context
     * @param value data context
     */
    export default function DataContextBinding(value?: any): any;

    export interface DataContextBinding {
        /** 
         * Selects all the elements that need binding and binds the data to the context.
         * @param rootElement DOM root element. Child elements are also reviewed.
         * @param rebinding If true, then already binded elements will rebinding.
         */
        bindAllElements(rootElement: Node, rebinding: boolean = false): void;
        /**  
         * Trying to bind this element.
         * @param element DOM element.
         * @param rebinding If true, then binds again.
         */
        bindElement(element: Node, rebinding: boolean = false): void;
        /** 
         * Get-Set binding context
         * @param element DOM element.
         * @param rebinding If true, then binds again.
         */
        bindingContext(element: Node, rebinding: boolean): BindingContext | null;

        // default bind function
        innerHTML(event: object): boolean;
        value(event: object): boolean;
        check(event: object): boolean;
        hidden(event: object): boolean;
        input(event: object): boolean;
        input_checkbox(event: object): boolean;
        input_color(event: object): boolean;
        input_date(event: object): boolean;
        input_datetime_local(event: object): boolean;
        input_email(event: object): boolean;
        input_file(event: object): boolean;
        input_hidden(event: object): boolean;
        input_month(event: object): boolean;
        input_number(event: object): boolean;
        input_password(event: object): boolean;
        input_radio(event: object): boolean;
        input_range(event: object): boolean;
        input_search(event: object): boolean;
        input_tel(event: object): boolean;
        input_text(event: object): boolean;
        input_time(event: object): boolean;
        input_url(event: object): boolean;
        input_week(event: object): boolean;
        select(event: object): boolean;
        textarea(event: object): boolean;
    }

    export interface BindingContext {
        /** Bindable DOM element */
        element: Node;
        /** Data Context */
        source: any;
        /** Property name in data context */
        property: string;
        /** Property path to root */
        path: string[];
        /** Proxy Value */
        value: any;

        /** Set-Get value to data-context. */
        contextValue(value?: any): any;
        /** Set-Get isActive value. */
        isActive(activate: boolean = true): boolean;
        /** Remove value in Data Context */
        remove(): void;
    }
}
