const MOBILE = /^(?:\+251|251|0)?[79]\d{8}$/;

export const isEthiopianMobile = (v: string) => MOBILE.test(v.replace(/[\s-]/g, ''));