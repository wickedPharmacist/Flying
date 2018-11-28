namespace app.splash {
	/**
	 * 启动界面
	 */
	export class Splash extends eui.Component implements eui.UIComponent {
		protected childrenCreated(): void {
			super.childrenCreated();

			const loadView = new LoadingUI();
			this.addChild(loadView);
			Application.loadResource(
				[
					{ url: "resource/config/app/res/main.res.json", resRoot: "resource/" }
				],
				{ url: "resource/config/app/thm/main.thm.json", stage: this.stage },
				[
					{ name: "preload" },
					{ name: "home" },
				],
				loadView
			).then(() => {
				this.removeChild(loadView);

				/** 进入主界面 */
				let layer = this.parent;
				layer.removeChild(this);
				layer.addChild(new home.Home())
			}).catch(e => {
				console.log(e);
			});
		}
	}
}