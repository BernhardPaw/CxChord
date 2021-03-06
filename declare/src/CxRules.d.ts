/// <reference path="references.d.ts" />
/// <reference types="lodash" />
declare namespace CxChord {
    interface RuleMap<K, V> {
        get(key: K): V;
        has(key: K): boolean;
        set(key: K, value: V): Map<K, V>;
        size: number;
    }
    class Rules implements RuleMap<string, Rule> {
        debugKey: string;
        ruleMap: {};
        size: number;
        get(key: any): any;
        has(key: any): any;
        set(key: any, value: any): any;
        constructor(_chord?: ChordInstance, debugKey?: string);
    }
}
