class Application extends egret.DisplayObjectContainer {
    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
        this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.onRemoveFromStage, this);
    }

    /** 添加到舞台 */
    protected onAddToStage(): void {
        this.removeEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
        this.stage.addEventListener(egret.Event.RESIZE, this.onStageResize, this);
        this.onStageResize();

        this.init();

        Application.loadResource(
            [
                { url: "resource/config/app/res/splash.res.json", resRoot: "resource/" }
            ],
            { url: "resource/config/app/thm/splash.thm.json", stage: this.stage },
            [
                { name: "splash" }
            ]
        ).then(() => {
            /** 进入主界面 */
            this.addChild(new app.splash.Splash());
        }).catch(e => {
            console.log(e);
        })
    }

    /** 从舞台移除 */
    protected onRemoveFromStage(): void {
        this.removeEventListener(egret.Event.REMOVED_FROM_STAGE, this.onRemoveFromStage, this);
        this.stage.removeEventListener(egret.Event.RESIZE, this.onStageResize, this);
    }

    /** 舞台尺寸改变 */
    protected onStageResize(): void {
        this.width = this.stage.stageWidth, this.height = this.stage.stageHeight;
    }

    /** 初始化 */
    private init(): boolean {
        egret.lifecycle.addLifecycleListener((context) => {
            // custom lifecycle plugin
        })

        egret.lifecycle.onPause = () => {
            egret.ticker.pause();
        }

        egret.lifecycle.onResume = () => {
            egret.ticker.resume();
        }

        //注入自定义的素材解析器
        egret.registerImplementation("eui.IAssetAdapter", new app.AssetAdapter());
        egret.registerImplementation("eui.IThemeAdapter", new app.ThemeAdapter());

        return true;
    }

    /** 加载 */
    public static async loadResource(
        /** 配置集 */
        configs: {
            /** 资源配置的url地址 */
            url: string,
            /** 资源配置的根地址 */
            resRoot: string
        }[],
        /** 主题 */
        theme: {
            /** 要加载并解析的外部主题配置文件路径，若传入 null，将不进行配置文件加载，之后需要在外部以代码方式手动调用 mapSkin() 方法完成每条默认皮肤名的注册。 */
            url: string,
            /** 当前舞台引用，若传入null，需要在外部手动调用 egret.registerImplementation("eui.Theme",theme) 来完成主题的注册。 */
            stage?: egret.Stage
        },        /** 资源组集 */
        resGroup: {
            /** 要加载资源组的组名 */
            name: string,
            /** 加载优先级,可以为负数,默认值为 0。低优先级的组必须等待高优先级组完全加载结束才能开始，同一优先级的组会同时加载。 */
            priority?: number,
            /** 资源组的加载进度提示 */
            reporter?: RES.PromiseTaskReporter
        }[],
        /** 资源组的总加载进度提示 */
        reporter?: RES.PromiseTaskReporter) {
        /** 加载资源配置 */
        for (const config of configs || []) {
            await RES.loadConfig(config.url, config.resRoot);
        }
        /** 加载主题配置 */
        await new Promise((resolve, reject) => {
            let thm = new eui.Theme(theme.url, theme.stage);
            thm.addEventListener(eui.UIEvent.COMPLETE, () => { 
                resolve(); 
            }, this);
        });
        /** 加载预加载资源组 */
        if (reporter) {
            let current: { [name: string]: number } = {};
            let total: number = 0;
            for (const group of resGroup || []) {
                current[group.name] = 0;
                total += RES.getGroupByName(group.name).length;
            }
            let onProgress = (e: RES.ResourceEvent) => {
                current[e.groupName] = e.itemsLoaded;
                let curTotal = 0;
                for (const name in current)
                    curTotal += current[name];
                if (reporter.onProgress)
                    reporter.onProgress(curTotal, total, e.resItem);
                if (curTotal === total)
                    RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, onProgress, this);
            }
            if (total > 0)
                RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, onProgress, this);
        }
        for (const group of resGroup || []) {
            await RES.loadGroup(group.name, group.priority, group.reporter);
        }
    }
}
global.Application = Application;