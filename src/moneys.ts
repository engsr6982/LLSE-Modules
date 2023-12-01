// Usage:
// 初次使用请先调用initModule初始化模块

interface _MoneyConfig {
    /**开关 */
    Enable: boolean;
    /**经济类型 */
    MoneyType: "llmoney" | "score";
    /**计分板经济名称 */
    ScoreType: string;
    /**经济名称 */
    MoneyName: string;
}

interface _Money_Cfg_Cache_Type {
    /**是否初始化 */
    init: boolean;
    Money: _MoneyConfig;
}

export const _Money_Cfg_Cache: _Money_Cfg_Cache_Type = {
    init: false,
    Money: {
        Enable: null,
        MoneyName: null,
        ScoreType: null,
        MoneyType: null,
    },
};

export class moneys {
    /**
     * 初始化模块
     * @param moneyConfig 模块配置项
     * @returns 是否初始化成功
     */
    static initModule(moneyConfig: _MoneyConfig): boolean {
        try {
            _Money_Cfg_Cache.Money.Enable = moneyConfig.Enable;
            _Money_Cfg_Cache.Money.MoneyName = moneyConfig.MoneyName;
            _Money_Cfg_Cache.Money.ScoreType = moneyConfig.ScoreType;
            _Money_Cfg_Cache.Money.MoneyType = moneyConfig.MoneyType;
            _Money_Cfg_Cache.init = true;
            return true;
        } catch (err) {
            logger.error(`初始化模块失败 ${err}\n${err.stack}`);
            return false;
        }
    }

    /**
     * 模块配置项是否初始化
     * @returns 是否初始化
     */
    static isModuleInit(): boolean {
        return _Money_Cfg_Cache.init;
    }

    /**
     * 向玩家发送一条消息
     * @param player 玩家对象
     * @param msg 消息内容
     * @returns 是否发送成功
     */
    static tell(player: Player, msg: string): boolean {
        return player.tell(`[moneys] ${msg}`);
    }

    /**
     * 未知经济（抛出错误）
     * @param player 玩家对象（可选）
     */
    static unknownMoneyType(player?: Player) {
        player ? this.tell(player, `出现了一个错误，导致插件无法完成该操作，请联系服务器管理员。`) : null;
        throw new Error("未知的经济类型" + _Money_Cfg_Cache.Money.MoneyType);
    }

    /**
     * 获取玩家经济
     * @param player 玩家对象
     * @returns 玩家的经济
     */
    static getPlayeyMoney(player: Player): number {
        switch (_Money_Cfg_Cache.Money.MoneyType) {
            case "llmoney":
                return money.get(player.xuid);
            case "score":
                return player.getScore(_Money_Cfg_Cache.Money.ScoreType);
            default:
                this.unknownMoneyType(player);
        }
    }

    /**
     * 获取玩家操作经济消耗字符串
     * @param player 玩家对象
     * @param deMoney 要消耗的经济
     * @returns 字符串
     */
    static getPlayerMoneyStr(player: Player, deMoney: number) {
        const playerMoney = _Money_Cfg_Cache.Money.Enable ? this.getPlayeyMoney(player) : 0;
        return `§l此操作需消耗§9[§e${deMoney}§9]§r§l${_Money_Cfg_Cache.Money.MoneyName}, 当前${_Money_Cfg_Cache.Money.MoneyName}: §a${playerMoney}`;
    }

    /**
     * 给玩家添加经济
     * @param player 玩家对象
     * @param addMoney 要增加的经济
     * @returns 是否增加成功
     */
    static addPlayerMoney(player: Player, addMoney: number) {
        if (_Money_Cfg_Cache.Money.Enable === false) return true;
        switch (_Money_Cfg_Cache.Money.MoneyType) {
            case "llmoney":
                return money.add(player.xuid, addMoney);
            case "score":
                return player.addScore(_Money_Cfg_Cache.Money.ScoreType, addMoney);
            default:
                this.unknownMoneyType(player);
        }
    }

    /**
     * 扣除玩家经济
     * @param player 玩家对象
     * @param deMoney 要扣除的经济
     * @returns 是否扣除成功
     */
    static deductPlayerMoney(player: Player, deMoney: number) {
        if (_Money_Cfg_Cache.Money.Enable === false) return true;
        const cm = this.getPlayeyMoney(player);
        if (cm >= deMoney) {
            switch (_Money_Cfg_Cache.Money.MoneyType) {
                case "llmoney":
                    return money.reduce(player.xuid, deMoney);
                case "score":
                    return player.reduceScore(_Money_Cfg_Cache.Money.ScoreType, deMoney);
                default:
                    this.unknownMoneyType(player);
            }
        }
        this.tell(player, `${_Money_Cfg_Cache.Money.MoneyName}不足！ 无法继续操作!`);
        return false;
    }
}
