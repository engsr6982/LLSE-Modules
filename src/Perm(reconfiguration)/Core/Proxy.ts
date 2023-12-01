import { _Perm_Object } from "../index.js";

/**
 * @author engsr6982
 */
export class proxyObject {
    /**
     * 获取所有键
     * @returns 所有键
     */
    static keys() {
        return Object.keys(_Perm_Object);
    }
    /**
     * 获取所有权限值
     * @returns 所有权限值
     */
    static values() {
        return Object.values(_Perm_Object).map(({ value }) => value);
    }
    /**
     * 获取所有权限名
     * @returns 所有权限名
     */
    static names() {
        return Object.values(_Perm_Object).map(({ name }) => name);
    }

    /**
     * 键 => 数据
     * @param key 键
     * @returns 数据
     */
    static keyToObject(key: string) {
        const perm = _Perm_Object[key];
        return {
            name: perm.name,
            value: perm.value,
            key: key,
        };
    }

    /**
     * 名称 => 数据
     * @param name 名称
     * @returns 数据
     */
    static nameToObject(name: string) {
        const key = Object.keys(_Perm_Object).find((key) => _Perm_Object[key].name === name);
        if (key) {
            return {
                name: _Perm_Object[key].name,
                value: _Perm_Object[key].value,
                key: key,
            };
        }
    }

    /**
     * 权限值 => 数据
     * @param value 权限值
     * @returns 数据
     */
    static valueToObject(value: string) {
        const key = Object.keys(_Perm_Object).find((key) => _Perm_Object[key].value === value);
        if (key) {
            return {
                name: _Perm_Object[key].name,
                value: _Perm_Object[key].value,
                key: key,
            };
        }
    }
}
