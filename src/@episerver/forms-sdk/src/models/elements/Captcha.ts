import { ValidatableElementBase, ValidatableElementBaseProperties } from "./base/ValidatableElementBase";
/**
 * Include an image challenge that asks the user to identify numbers and characters 
 */
export interface Captcha extends ValidatableElementBase {
    properties: CaptchaProperties
}

export interface CaptchaProperties extends ValidatableElementBaseProperties {
    refreshButtonLabel: string
    captchaImageHandler: string
    imageWidth: number
    imageHeight: number
    captchaImageAlt: string
    textLength: number
}