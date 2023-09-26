import { ValidatableElementBase, ValidatableElementBaseProperties } from "./base/ValidatableElementBase";

export interface Captcha extends ValidatableElementBase {
    properties: CaptchaProperties
}

export interface CaptchaProperties extends ValidatableElementBaseProperties {
    refreshButtonLabel: string
    captchaImageHandler: string
    imageHeight: string
    captchaImageAlt: string
    textLength: string
}