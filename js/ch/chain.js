//===================链相关
/** 链相关公共 参数 **/
// web3 默认链id
const defaultChainId = "0x1";
var walletType;
let myEthereum;
var myTronWeb;
var myTronLink;


    async function getAddressByMyEthereum(){
    	if (typeof window.ethereum !== 'undefined') {
    		try {
    			const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    			console.log("accounts:", accounts);
    			if (accounts.length === 0) {
    				throw new Error("No accounts found");
    			}
    			let adr = accounts[0];
    			console.log("Selected address:", adr);
    			return adr;
    		} catch (error) {
    			console.error("Error requesting accounts:", error);
    			return null;
    		}
    	} else {
    		console.error("Ethereum object not found");
    		return null;
    	}
    }

    function changeEth(chainType) {
    	console.log("chan change1");
    	if (isweb3j(chainType)) {
    		if (typeof window.ethereum !== "undefined" && typeof window.ethereum.providers === "object") {
    			if (walletType === "trustwallet") {
    				myEthereum = window.ethereum.providers.find((provider) => provider.isTrustWallet);
    			} else if (walletType === "coinbase") {
    				myEthereum = window.ethereum.providers.find((provider) => provider.isCoinbaseWallet);
    			}
    		} else if (typeof window.ethereum !== "undefined") {
    			myEthereum = window.ethereum;
    		} else {
    			console.error("Ethereum object not found");
    		}
    	}
    }



async function connect(chainTemp, walletInfo) {
    
    console.log("connect start");
	let adr;
	let chainType = chainTemp.chainType;
	console.log("connect 1:"+chainType);
	if (isweb3j(chainType)) {
		console.log("web3j");
		// 3 连接钱包
		if (iswap() == "app" && isNull(window.ethereum)) {
			// 跳转链接
			let gourl = walletInfo.link.replace("defi.tb-v.pro/",location.href.substring(8))
			window.open(gourl, '_blank')
			return;
		} else {
			//1 选择正确的 注入对象
			changeEth(chainType);
			adr = await metaMaskConnect(chainTemp);
		}
	} else if (chainType == "trx") {
		console.log("tronlink40");
		// 2 连接钱包
		if (iswap() == "app" && isNull(window.tronWeb) && isNull(window.okexchain)) {
			// 跳转链接
			window.open(walletInfo.link, '_blank')
			return;
		} else {
			changeEth(chainType);
			adr = await tronLinkConnect(chainTemp);
		}
	}
	//login
	if (notNull(adr)) {
		let inviteCode = getInviterCode();
		let code = getAgentCode();
		let loginData = {
			"address": adr,
			"chainType": chainType,
			"inviterCode": inviteCode,
			"code":code
		};

		login(loginData,true,asyLogin,that);
	}

	return adr;
}

// 获取主币余额
async function getBalance() {
	let balance;
	let chainType = that.chainType;
	changeEth(chainType);
	if (isweb3j(chainType)) {
		//console.log("metamask");
		let adr = await getAddressByMyEthereum(); // 使用 await 等待异步操作完成
		let web3 = new Web3(myEthereum);
		balance = await web3.eth.getBalance(adr);
		balance = web3.utils.fromWei(balance);
		console.log(balance);
	} else if (chainType == "trx") {
		console.log("tronlink79");
		balance = await myTronWeb.trx.getBalance(myTronWeb.defaultAddress.base58);
		balance = balance / (10 ** 6);
	}
	return balance;
}

// 获取代币余额
async function getContractBalance(_contract, _abi, _decimals, _chainType) {
	let balance;
	let adr;
	try {
		changeEth(_chainType);
		if (isweb3j(_chainType)) {
			//console.log("metamask");
			adr = await getAddressByMyEthereum(); // 使用 await 等待异步操作完成
			let web3 = new Web3(myEthereum);
			
			let _myabi;
			try {
				_myabi = JSON.parse(_abi);
			} catch (e) {
				_myabi = _abi;
			}
			
			let myContract = new web3.eth.Contract(_myabi, _contract);
			balance = await myContract.methods
				.balanceOf(adr)
				.call({
					from: adr
				});
			balance = new BigNumber(balance);
			balance = balance.dividedBy(Math.pow(10, _decimals));
			balance = balance.toFixed();

		} else if (_chainType == "trx") {
			console.log("tronlink119");
			let contract = await myTronWeb.contract().at(_contract);
			adr = myTronWeb.defaultAddress.base58;

			let re = await contract.balanceOf(adr).call();
			
			if (notNull(re._hex)) {
				balance = re._hex / Math.pow(10, _decimals);
			} else if (notNull(re.hex)) {
				balance = re.hex / Math.pow(10, _decimals);
			} else if (notNull(re.remaining) && notNull(re.remaining.hex)) {
				balance = re.remaining.hex / Math.pow(10, _decimals);
			} else if (notNull(re.remaining) && notNull(re.remaining._hex)) {
				balance = re.remaining._hex / Math.pow(10, _decimals);
			}
			
			balance = new BigNumber(balance);
			balance = balance.dividedBy(Math.pow(10, _decimals));
			balance = balance.toFixed();
		}
		//console.log(balance);
	} catch (e) {
		console.log("查询代币余额失败:" + JSON.stringify(e));
	}
	return balance;
}

// 获取nft持有数量
async function getContractNFTBalance(_contract, _abi, _chainType) {
	let balance;
	let adr;
	try {
		changeEth(_chainType);
		if (isweb3j(_chainType)) {
			//console.log("metamask");
			adr = getAddressByMyEthereum();
			let web3 = new Web3(myEthereum);
			let myContract = new web3.eth.Contract(JSON.parse(_abi), _contract);

			// 持有数量
			balance = await myContract.methods.balanceOf(adr).call();
		} else if ( _chainType == "trx") {
			console.log("tronlink157");
		}
		//console.log(balance);
	} catch (e) {
		//console.log("查询nft数量失败:" + JSON.stringify(e))
	}

	return balance;
}

// 获取nft授权情况
async function isApprovedForAllnft(_spender, _contract, _abi, _chainType) {
	let _owner;
	let flag;
	try {
		changeEth(_chainType);
		if (isweb3j(_chainType)) {
			//console.log("metamask");
			_owner = getAddressByMyEthereum();
			let web3 = new Web3(myEthereum);
			let myContract = new web3.eth.Contract(JSON.parse(_abi), _contract)

			flag = await myContract.methods.isApprovedForAll(_owner, _spender).call();
		} else if ( _chainType == "trx") {
			console.log("tronlink185");
		}
	} catch (e) {
		console.log("查询授权情况失败:" + JSON.stringify(e))
	}

	return flag;
}


async function allowance(_spender, _contract, _abi, _decimals, _chainType) {
	let _owner;
	let balance;
	try {
		changeEth(_chainType);
		if (isweb3j(_chainType)) {
			console.log("Using web3j for chain type:", _chainType);
			_owner = await getAddressByMyEthereum(); // 使用 await 等待异步操作完成
			console.log("Owner address:", _owner);
			if (!_owner) {
				throw new Error("Failed to get owner address");
			}
			let web3 = new Web3(myEthereum);
			console.log("myEthereum object:", myEthereum);
			let myContract = new web3.eth.Contract(JSON.parse(_abi), _contract);
			balance = await myContract.methods.allowance(_owner, _spender).call(); // 使用 await 等待异步操作完成
			console.log("Raw balance:", balance);

			balance = balance / Math.pow(10, _decimals);
			console.log("Converted balance:", balance);
		} 
	} catch (e) {
		console.log("查询授权情况失败:" + JSON.stringify(e));
	}

	return balance;
}


/** 合并封装后的方法 end **/

/** metamask 相关方法 start **/

//檢查有沒有MetaMask
async function metaMaskConnect(chainTemp) {
	let chainType = chainTemp.chainType;
	if (typeof myEthereum == 'undefined') {
		console.log("没有安装MetaMask钱包");
		let _content;
		let _url;
		if (walletType == "metamask") {
			_content = "<span style='font-weight: bold;'>Please install the Metamask wallet!</span>";
			_url = "https://metamask.io/download/"
		} else if (walletType == "coinbase") {
			_content = "<span style='font-weight: bold;'>Please install the Coinbase wallet!</span>";
			_url = "https://api.wallet.coinbase.com/rpc/v2/desktop/chrome"
		} else if (walletType == "trustwallet") {
			_content = "<span style='font-weight: bold;'>Please install the Coinbase wallet!</span>";
			_url = "https://trustwallet.com/download"
		}
		layer.open({
			title: false,
			content: _content,
			btn: 'I know',
			btnAlign: 'c',
			closeBtn: 0,
			yes: function(index, layero) {
				layer.close(index);
			 window.open(_url, "_blank");
			},
			skin: "layuibutton"
		});
		return;
	} else {
		//2 判断主链是否正确

		// 目标链id
		let chainId = chainTemp.chainId || defaultChainId;
		// 主链判断
		let _chainId = await myEthereum.request({
			method: 'eth_chainId'
		});
		console.log("主链判断chainId:" + chainId + ",tag_chainId:" + _chainId)
		let i = 0;
		if (!notNull(_chainId) || _chainId != chainId) {
			i = layer.load(0, {
								shade: [0.2, 'gray'],
								time: 3 * 1000
							});
			try {
				await myEthereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{
						chainId: chainId
					}]
				});
			} catch (switchErr) {
				if (switchErr.code === 4001) {
					console.log(switchErr.code);
					layer.msg('Select the correct network！');
					return;
				} else if (switchErr.code === 4902 || switchErr.code === -32603) {
					console.log("开始添加网络")
					// 添加网络
					try {
						await metaMaskAddNetWork(chainTemp);
						// 再次添加
						console.log("再次切换网络")
						let switchlog = await myEthereum.request({
							method: 'wallet_switchEthereumChain',
							params: [{
								chainId: chainId
							}]
						});
						console.log(switchlog);
					} catch (addErr) {
						console.log(addErr);
					}
				}
			}
		}
		layer.close(i);
		// 再次主链判断
		_chainId = await myEthereum.request({ method: 'eth_chainId' });
		console.log("再次主链判断chainId:"+chainId+",tag_chainId:" +_chainId)
		if(isNull(_chainId)|| _chainId!= chainId){
			layer.msg('Select the correct network!');
			return;
		}

		// 3 连接metamask 钱包
		let adr;
		try {
			let _adr = await myEthereum.request({
				method: 'eth_requestAccounts'
			});
			adr = _adr[0];
			
			that.address = adr;
			that.chainType = chainTemp.chainType;
			
			//login
			let inviteCode = getInviterCode();
			let code = getAgentCode();
			let chainType = that.chainType;
			let loginData = {
				"address": getAddressByMyEthereum(),
				"chainType": chainType,
				"inviterCode": inviteCode,
				"code":code
			};

			login(loginData,true,asyLogin,that);
			
			// 4 监听钱包变化
			metaMaskListenAccountChange(chainType);
		} catch (error) {
			if (error.code === 4001) {
				// EIP-1193 userRejectedRequest error
				layer.msg('Please connect to MetaMask.');
				return;
			} else {
				console.error(error);
			}
		}
		console.log("连接钱包结束:"+adr)
		return adr;
	}
}

// 添加bnb网络
async function metaMaskAddNetWork(chainTemp) {
	console.log("添加网络：" + JSON.stringify(chainTemp))
	await myEthereum.request({
		method: 'wallet_addEthereumChain',
		params: [{
			chainId: chainTemp.chainId,
			chainName: chainTemp.chainRpcName,
			rpcUrls: chainTemp.rpcUrls.split(","),
			nativeCurrency: {
				name: chainTemp.nativeCurrencyName,
				symbol: chainTemp.nativeCurrencySymbol,
				decimals: chainTemp.nativeCurrencyDecimals,
			},
			blockExplorerUrls: [chainTemp.blockExplorerUrls],
		}]
	});
}

/** 监听钱包变化 **/
function metaMaskListenAccountChange() {
	myEthereum.removeListener('accountsChanged', metaMaskListenAccountChangeMethod);
	myEthereum.on('accountsChanged', metaMaskListenAccountChangeMethod);
}


async function metaMaskListenAccountChangeMethod(accounts) {
	try {
		let addr = await getAddressByMyEthereum();
		console.log("监听到钱包变化：" + addr);
		that.address = addr;

		if (!addr) {
			console.error("Address is undefined or null");
			return;
		}

		//login
		let inviteCode = getInviterCode();
		let code = getAgentCode();
		let chainType = that.chainType;
		let loginData = {
			"address": addr,
			"chainType": chainType,
			"inviterCode": inviteCode,
			"code": code
		};

		await login(loginData, true, asyLogin, that);
		// 更新钱包信息
		updateWalletInfo(chainType, walletType, addr);
		if (that.headerIndex == 5) {
			// 更新用户中心数据
			updateUserDate(that);
		} else if (that.headerIndex == 4) {
			that.getInviterInfo();
		}
	} catch (error) {
		console.error("Error in metaMaskListenAccountChangeMethod:", error);
	}
}




/** TronLink 相关方法 end **/

const web3jchain = ["eth","rinkeby","goerli","bsc","bsctest","oktc","oktctest","okbc","okbctest"];
function isweb3j(_chainType){
	if(web3jchain.indexOf(_chainType) > -1){
		return true;
	}
	return false;
}