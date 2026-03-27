export interface CoinConfig {
  id: string            // CoinGecko id (for reference)
  binanceSymbol: string // Binance trading pair e.g. BTCUSDT
  symbol: string        // e.g. BTC
  name: string          // e.g. Bitcoin
  slug: string          // URL slug e.g. btc
  listingDate: string   // YYYY-MM-DD — earliest date with Binance data
  category: string      // L1, DeFi, Meme, etc.
  description: {
    en: string
    ko: string
  }
}

export const SUPPORTED_COINS: CoinConfig[] = [
  {
    id: 'bitcoin', binanceSymbol: 'BTCUSDT', symbol: 'BTC', name: 'Bitcoin', slug: 'btc',
    listingDate: '2017-08-17', category: 'L1',
    description: {
      en: 'Bitcoin is the first and most valuable cryptocurrency, created in 2009 by Satoshi Nakamoto. It serves as a decentralized store of value and digital gold, with a fixed supply cap of 21 million coins.',
      ko: '비트코인은 2009년 사토시 나카모토가 만든 최초이자 가장 가치 있는 암호화폐입니다. 2,100만 개의 고정 공급량을 가진 탈중앙화 가치 저장 수단이자 디지털 금으로 기능합니다.',
    },
  },
  {
    id: 'ethereum', binanceSymbol: 'ETHUSDT', symbol: 'ETH', name: 'Ethereum', slug: 'eth',
    listingDate: '2017-08-17', category: 'L1',
    description: {
      en: 'Ethereum is a decentralized smart contract platform that powers DeFi, NFTs, and thousands of decentralized applications. Its native token ETH is used for gas fees and staking.',
      ko: '이더리움은 DeFi, NFT 및 수천 개의 탈중앙화 애플리케이션을 구동하는 스마트 컨트랙트 플랫폼입니다. 네이티브 토큰 ETH는 가스비와 스테이킹에 사용됩니다.',
    },
  },
  {
    id: 'solana', binanceSymbol: 'SOLUSDT', symbol: 'SOL', name: 'Solana', slug: 'sol',
    listingDate: '2020-08-11', category: 'L1',
    description: {
      en: 'Solana is a high-performance blockchain known for fast transactions and low fees. It uses a unique Proof of History consensus mechanism and supports DeFi, NFTs, and gaming applications.',
      ko: '솔라나는 빠른 거래 속도와 낮은 수수료로 알려진 고성능 블록체인입니다. 고유한 역사 증명(PoH) 합의 메커니즘을 사용하며 DeFi, NFT, 게임 앱을 지원합니다.',
    },
  },
  {
    id: 'binancecoin', binanceSymbol: 'BNBUSDT', symbol: 'BNB', name: 'BNB', slug: 'bnb',
    listingDate: '2017-11-06', category: 'Exchange',
    description: {
      en: 'BNB is the native token of the Binance ecosystem, used for trading fee discounts, transaction fees on BNB Chain, and participation in token launches on Binance Launchpad.',
      ko: 'BNB는 바이낸스 생태계의 네이티브 토큰으로, 거래 수수료 할인, BNB 체인 트랜잭션 수수료, 바이낸스 런치패드 토큰 참여에 사용됩니다.',
    },
  },
  {
    id: 'ripple', binanceSymbol: 'XRPUSDT', symbol: 'XRP', name: 'XRP', slug: 'xrp',
    listingDate: '2018-05-04', category: 'Payment',
    description: {
      en: 'XRP is a digital payment token designed for fast, low-cost cross-border transactions. It is used by Ripple\'s payment network to facilitate international money transfers.',
      ko: 'XRP는 빠르고 저렴한 국제 송금을 위해 설계된 디지털 결제 토큰입니다. 리플의 결제 네트워크에서 국제 송금을 촉진하는 데 사용됩니다.',
    },
  },
  {
    id: 'cardano', binanceSymbol: 'ADAUSDT', symbol: 'ADA', name: 'Cardano', slug: 'ada',
    listingDate: '2018-04-17', category: 'L1',
    description: {
      en: 'Cardano is a research-driven blockchain platform built on peer-reviewed academic research. It uses the Ouroboros proof-of-stake protocol and focuses on sustainability and scalability.',
      ko: '카르다노는 학술 연구를 기반으로 구축된 블록체인 플랫폼입니다. 우로보로스 지분증명 프로토콜을 사용하며 지속가능성과 확장성에 중점을 둡니다.',
    },
  },
  {
    id: 'dogecoin', binanceSymbol: 'DOGEUSDT', symbol: 'DOGE', name: 'Dogecoin', slug: 'doge',
    listingDate: '2019-07-05', category: 'Meme',
    description: {
      en: 'Dogecoin started as a meme cryptocurrency in 2013 but has grown into one of the most popular digital currencies, known for its active community and use as a tipping currency.',
      ko: '도지코인은 2013년 밈 암호화폐로 시작했지만 활발한 커뮤니티와 팁 통화로의 활용으로 가장 인기 있는 디지털 화폐 중 하나로 성장했습니다.',
    },
  },
  {
    id: 'polkadot', binanceSymbol: 'DOTUSDT', symbol: 'DOT', name: 'Polkadot', slug: 'dot',
    listingDate: '2020-08-18', category: 'L0',
    description: {
      en: 'Polkadot is a multi-chain protocol that enables different blockchains to interoperate. Created by Ethereum co-founder Gavin Wood, it connects specialized blockchains into one unified network.',
      ko: '폴카닷은 서로 다른 블록체인 간의 상호운용성을 가능하게 하는 멀티체인 프로토콜입니다. 이더리움 공동 창립자 개빈 우드가 만들었습니다.',
    },
  },
  {
    id: 'avalanche-2', binanceSymbol: 'AVAXUSDT', symbol: 'AVAX', name: 'Avalanche', slug: 'avax',
    listingDate: '2020-09-22', category: 'L1',
    description: {
      en: 'Avalanche is a fast, low-cost smart contract platform that supports Ethereum-compatible DeFi applications. It uses a novel consensus protocol to achieve high throughput.',
      ko: '아발란체는 이더리움 호환 DeFi 애플리케이션을 지원하는 빠르고 저렴한 스마트 컨트랙트 플랫폼입니다. 높은 처리량을 달성하기 위해 새로운 합의 프로토콜을 사용합니다.',
    },
  },
  {
    id: 'chainlink', binanceSymbol: 'LINKUSDT', symbol: 'LINK', name: 'Chainlink', slug: 'link',
    listingDate: '2019-01-16', category: 'Oracle',
    description: {
      en: 'Chainlink is a decentralized oracle network that connects smart contracts to real-world data, APIs, and payment systems. It is essential infrastructure for DeFi protocols.',
      ko: '체인링크는 스마트 컨트랙트를 실제 데이터, API, 결제 시스템에 연결하는 탈중앙화 오라클 네트워크입니다. DeFi 프로토콜의 필수 인프라입니다.',
    },
  },
  {
    id: 'matic-network', binanceSymbol: 'MATICUSDT', symbol: 'MATIC', name: 'Polygon', slug: 'matic',
    listingDate: '2019-04-26', category: 'L2',
    description: {
      en: 'Polygon is an Ethereum Layer 2 scaling solution that provides faster, cheaper transactions. It has become one of the most widely adopted scaling networks in the crypto ecosystem.',
      ko: '폴리곤은 더 빠르고 저렴한 거래를 제공하는 이더리움 레이어 2 스케일링 솔루션입니다. 크립토 생태계에서 가장 널리 채택된 스케일링 네트워크 중 하나입니다.',
    },
  },
  {
    id: 'tron', binanceSymbol: 'TRXUSDT', symbol: 'TRX', name: 'TRON', slug: 'trx',
    listingDate: '2018-04-20', category: 'L1',
    description: {
      en: 'TRON is a blockchain platform focused on content sharing and entertainment. It has become one of the largest networks for stablecoin transfers, particularly USDT.',
      ko: 'TRON은 콘텐츠 공유와 엔터테인먼트에 중점을 둔 블록체인 플랫폼입니다. 특히 USDT를 비롯한 스테이블코인 전송의 주요 네트워크로 성장했습니다.',
    },
  },
  {
    id: 'uniswap', binanceSymbol: 'UNIUSDT', symbol: 'UNI', name: 'Uniswap', slug: 'uni',
    listingDate: '2020-09-17', category: 'DeFi',
    description: {
      en: 'Uniswap is the largest decentralized exchange (DEX) built on Ethereum. Its automated market maker (AMM) model revolutionized how tokens are traded without intermediaries.',
      ko: '유니스왑은 이더리움 기반의 최대 탈중앙화 거래소(DEX)입니다. 자동화된 마켓 메이커(AMM) 모델로 중개자 없는 토큰 거래를 혁신했습니다.',
    },
  },
  {
    id: 'litecoin', binanceSymbol: 'LTCUSDT', symbol: 'LTC', name: 'Litecoin', slug: 'ltc',
    listingDate: '2017-12-13', category: 'Payment',
    description: {
      en: 'Litecoin is one of the earliest Bitcoin alternatives, created in 2011 by Charlie Lee. It offers faster block times and lower fees, positioning itself as "silver to Bitcoin\'s gold."',
      ko: '라이트코인은 2011년 찰리 리가 만든 초기 비트코인 대안 중 하나입니다. 더 빠른 블록 시간과 낮은 수수료로 "비트코인의 은"으로 자리매김했습니다.',
    },
  },
  {
    id: 'cosmos', binanceSymbol: 'ATOMUSDT', symbol: 'ATOM', name: 'Cosmos', slug: 'atom',
    listingDate: '2019-04-22', category: 'L0',
    description: {
      en: 'Cosmos is an ecosystem of interoperable blockchains connected through the Inter-Blockchain Communication (IBC) protocol. It enables sovereign blockchains to communicate and transfer assets.',
      ko: 'Cosmos는 IBC(Inter-Blockchain Communication) 프로토콜을 통해 연결된 상호운용 블록체인 생태계입니다. 독립 블록체인 간 통신과 자산 전송을 가능하게 합니다.',
    },
  },
  {
    id: 'near', binanceSymbol: 'NEARUSDT', symbol: 'NEAR', name: 'NEAR Protocol', slug: 'near',
    listingDate: '2020-10-14', category: 'L1',
    description: {
      en: 'NEAR Protocol is a sharded, developer-friendly blockchain designed for scalability. It uses Nightshade sharding technology and supports account abstraction for easier onboarding.',
      ko: 'NEAR 프로토콜은 확장성을 위해 설계된 샤딩 기반의 개발자 친화적 블록체인입니다. Nightshade 샤딩 기술을 사용하며 쉬운 온보딩을 위한 계정 추상화를 지원합니다.',
    },
  },
  {
    id: 'stellar', binanceSymbol: 'XLMUSDT', symbol: 'XLM', name: 'Stellar', slug: 'xlm',
    listingDate: '2018-05-21', category: 'Payment',
    description: {
      en: 'Stellar is an open network for storing and moving money, designed to make financial services more accessible. It enables fast cross-border payments with minimal fees.',
      ko: 'Stellar는 금융 서비스 접근성을 높이기 위해 설계된 개방형 네트워크입니다. 최소 수수료로 빠른 국경 간 결제를 가능하게 합니다.',
    },
  },
  {
    id: 'filecoin', binanceSymbol: 'FILUSDT', symbol: 'FIL', name: 'Filecoin', slug: 'fil',
    listingDate: '2020-10-15', category: 'Storage',
    description: {
      en: 'Filecoin is a decentralized storage network that turns cloud storage into an open market. Users can rent out spare hard drive space or pay to store files on the network.',
      ko: 'Filecoin은 클라우드 스토리지를 개방형 시장으로 전환하는 탈중앙화 스토리지 네트워크입니다. 여유 하드 드라이브 공간을 임대하거나 파일을 저장할 수 있습니다.',
    },
  },
  {
    id: 'aave', binanceSymbol: 'AAVEUSDT', symbol: 'AAVE', name: 'Aave', slug: 'aave',
    listingDate: '2020-10-13', category: 'DeFi',
    description: {
      en: 'Aave is a leading decentralized lending and borrowing protocol. Users can earn interest on deposits and borrow assets using crypto as collateral, all without intermediaries.',
      ko: 'Aave는 선도적인 탈중앙화 대출 프로토콜입니다. 사용자는 예금에 대한 이자를 벌고 암호화폐를 담보로 자산을 빌릴 수 있으며, 모두 중개자 없이 이루어집니다.',
    },
  },
  {
    id: 'aptos', binanceSymbol: 'APTUSDT', symbol: 'APT', name: 'Aptos', slug: 'apt',
    listingDate: '2022-10-19', category: 'L1',
    description: {
      en: 'Aptos is a Layer 1 blockchain developed by former Meta engineers, using the Move programming language. It focuses on safety, scalability, and user experience.',
      ko: 'Aptos는 전 Meta 엔지니어들이 개발한 레이어 1 블록체인으로, Move 프로그래밍 언어를 사용합니다. 안전성, 확장성, 사용자 경험에 중점을 둡니다.',
    },
  },
  {
    id: 'sui', binanceSymbol: 'SUIUSDT', symbol: 'SUI', name: 'Sui', slug: 'sui',
    listingDate: '2023-05-03', category: 'L1',
    description: {
      en: 'Sui is a Layer 1 blockchain built by Mysten Labs, also using the Move language. It features object-centric architecture for parallel transaction processing and high throughput.',
      ko: 'Sui는 Mysten Labs가 구축한 레이어 1 블록체인으로, Move 언어를 사용합니다. 병렬 트랜잭션 처리와 높은 처리량을 위한 객체 중심 아키텍처가 특징입니다.',
    },
  },
  {
    id: 'arbitrum', binanceSymbol: 'ARBUSDT', symbol: 'ARB', name: 'Arbitrum', slug: 'arb',
    listingDate: '2023-03-23', category: 'L2',
    description: {
      en: 'Arbitrum is the largest Ethereum Layer 2 scaling solution using Optimistic Rollups. It provides cheaper, faster Ethereum transactions while inheriting Ethereum\'s security.',
      ko: 'Arbitrum은 옵티미스틱 롤업을 사용하는 최대 이더리움 레이어 2 스케일링 솔루션입니다. 이더리움의 보안을 계승하면서 더 저렴하고 빠른 거래를 제공합니다.',
    },
  },
  {
    id: 'optimism', binanceSymbol: 'OPUSDT', symbol: 'OP', name: 'Optimism', slug: 'op',
    listingDate: '2022-06-01', category: 'L2',
    description: {
      en: 'Optimism is an Ethereum Layer 2 using Optimistic Rollups to reduce gas fees and increase throughput. It leads the Superchain vision connecting multiple OP Stack chains.',
      ko: 'Optimism은 가스비를 줄이고 처리량을 늘리기 위해 옵티미스틱 롤업을 사용하는 이더리움 레이어 2입니다. 여러 OP Stack 체인을 연결하는 슈퍼체인 비전을 주도합니다.',
    },
  },
  {
    id: 'the-sandbox', binanceSymbol: 'SANDUSDT', symbol: 'SAND', name: 'The Sandbox', slug: 'sand',
    listingDate: '2020-08-14', category: 'Gaming',
    description: {
      en: 'The Sandbox is a virtual world where players can build, own, and monetize gaming experiences using NFTs and the SAND token on the Ethereum blockchain.',
      ko: 'The Sandbox는 플레이어가 이더리움 블록체인에서 NFT와 SAND 토큰을 사용하여 게임 경험을 구축, 소유, 수익화할 수 있는 가상 세계입니다.',
    },
  },
  {
    id: 'shiba-inu', binanceSymbol: 'SHIBUSDT', symbol: 'SHIB', name: 'Shiba Inu', slug: 'shib',
    listingDate: '2021-05-10', category: 'Meme',
    description: {
      en: 'Shiba Inu is a meme token that grew from a Dogecoin alternative into a full ecosystem with its own DEX (ShibaSwap), Layer 2 (Shibarium), and metaverse project.',
      ko: 'Shiba Inu는 도지코인 대안에서 자체 DEX(ShibaSwap), 레이어 2(Shibarium), 메타버스 프로젝트를 갖춘 완전한 생태계로 성장한 밈 토큰입니다.',
    },
  },
  {
    id: 'pepe', binanceSymbol: 'PEPEUSDT', symbol: 'PEPE', name: 'Pepe', slug: 'pepe',
    listingDate: '2023-05-05', category: 'Meme',
    description: {
      en: 'Pepe is a meme cryptocurrency inspired by the Pepe the Frog internet meme. It gained massive popularity in 2023 as one of the most viral meme tokens in crypto history.',
      ko: 'Pepe는 개구리 페페 인터넷 밈에서 영감을 받은 밈 암호화폐입니다. 2023년 크립토 역사상 가장 바이럴한 밈 토큰 중 하나로 큰 인기를 얻었습니다.',
    },
  },
  {
    id: 'injective-protocol', binanceSymbol: 'INJUSDT', symbol: 'INJ', name: 'Injective', slug: 'inj',
    listingDate: '2020-10-19', category: 'DeFi',
    description: {
      en: 'Injective is a blockchain built for DeFi, offering fully decentralized trading with zero gas fees. It supports cross-chain trading across Ethereum, Cosmos, and Solana.',
      ko: 'Injective는 DeFi를 위해 구축된 블록체인으로, 가스비 없는 완전 탈중앙화 거래를 제공합니다. 이더리움, Cosmos, 솔라나 간 크로스체인 거래를 지원합니다.',
    },
  },
  {
    id: 'render-token', binanceSymbol: 'RENDERUSDT', symbol: 'RENDER', name: 'Render', slug: 'render',
    listingDate: '2023-06-01', category: 'AI/Compute',
    description: {
      en: 'Render Network is a decentralized GPU rendering platform that connects artists needing rendering power with GPU owners willing to rent their compute capacity.',
      ko: 'Render Network는 렌더링 파워가 필요한 아티스트와 컴퓨팅 용량을 임대하려는 GPU 소유자를 연결하는 탈중앙화 GPU 렌더링 플랫폼입니다.',
    },
  },
  {
    id: 'fetch-ai', binanceSymbol: 'FETUSDT', symbol: 'FET', name: 'Fetch.ai', slug: 'fet',
    listingDate: '2019-03-28', category: 'AI/Compute',
    description: {
      en: 'Fetch.ai is an AI-powered blockchain platform that enables autonomous agents to perform tasks like data sharing, DeFi optimization, and supply chain management.',
      ko: 'Fetch.ai는 자율 에이전트가 데이터 공유, DeFi 최적화, 공급망 관리 등의 작업을 수행할 수 있는 AI 기반 블록체인 플랫폼입니다.',
    },
  },
]

// Top 20 coins for comparison pages (by market cap relevance)
export const TOP_COINS_FOR_COMPARISON = SUPPORTED_COINS.slice(0, 20)

export function getCoinBySlug(slug: string): CoinConfig | undefined {
  return SUPPORTED_COINS.find((c) => c.slug === slug)
}

export function getCoinById(id: string): CoinConfig | undefined {
  return SUPPORTED_COINS.find((c) => c.id === id)
}

// Generate all comparison pairs for top N coins, alphabetical by symbol
export function getComparisonPairs(coins: CoinConfig[] = TOP_COINS_FOR_COMPARISON): { coin1: CoinConfig; coin2: CoinConfig; slug: string }[] {
  const pairs: { coin1: CoinConfig; coin2: CoinConfig; slug: string }[] = []
  for (let i = 0; i < coins.length; i++) {
    for (let j = i + 1; j < coins.length; j++) {
      const [a, b] = [coins[i], coins[j]].sort((x, y) => x.symbol.localeCompare(y.symbol))
      pairs.push({ coin1: a, coin2: b, slug: `${a.slug}-vs-${b.slug}` })
    }
  }
  return pairs
}
