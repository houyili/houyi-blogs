# DSV4 架构讨论原始问答记录

- 生成时间：2026-05-13 10:54:21
- 数据源：`/Users/jyxc-dz-0100301/.codex/sessions/2026/05/11/rollout-2026-05-11T18-36-22-019e169b-ffc1-7d01-af44-f0e514cba8e0.jsonl`
- 说明：以下内容来自本地 Codex session JSONL 的可见文本。若历史上下文曾被系统 compression，本文只记录日志中可见内容，并在 HTML 中用主题覆盖矩阵交叉核对。

## 覆盖矩阵

| # | 时间 | 主题 | 用户问题摘要 | HTML 覆盖位置 |
|---:|---|---|---|---|
| 1 | 2026-05-11T10:36:51.987Z | Architecture overview | 请帮我全面解析DSV4的模型架构，一层层的，认真拆解相关的算子，而且输出的时候要是人话 | HTML §1-3 |
| 2 | 2026-05-11T17:28:07.890Z | General follow-up | 继续 | HTML relevant section |
| 3 | 2026-05-12T12:28:53.381Z | Hybrid Attention overview | Attention这块详细解释一下 | HTML §4-6 |
| 4 | 2026-05-12T12:48:02.938Z | Hybrid Attention / Indexer / sparse_attn | 这里的ratio=4、ratio=128是怎么交错的。 ratio=4 启用的Indexer是什么？和DSA一样吗？在代码中如何体现的？sparse_attn是只服务于ratio=4吗？128... | HTML §4 |
| 5 | 2026-05-12T12:49:16.113Z | attn_sink / Gated Attention | 为什么会采用attn_sink？Gated Attention不是会缓解这个问题吗？采用Gated Attention了吗？ | HTML §6 |
| 6 | 2026-05-12T12:52:37.734Z | RoPE / inverse RoPE + grouped output projection | 11. 为什么输出还要 inverse RoPE 这一块完全没有读懂，现在不是已经partial rope了吗 12. Output projection：分组低秩投影 这一步最好写一下数学公... | HTML §5, §8 |
| 7 | 2026-05-12T13:01:40.030Z | Hybrid Attention / Indexer / sparse_attn | DSV4 ratio=4 with overlap: 这个细节逻辑展开一下。 sparse attention的实现逻辑展开一下。 indexer部分用数学语言描述一下。 | HTML §4 |
| 8 | 2026-05-12T13:05:29.743Z | attn_sink / Gated Attention | 在DSV4的情况下Gated Attention和attn_sink的区别从算法Insight的角度详细对比一下，理论上一旦KV选得不对，也可以用Gated把那个head给压下去 | HTML §6 |
| 9 | 2026-05-12T13:08:10.277Z | RoPE / inverse RoPE / RoPER | inverse RoPE这块还是confuse，kv&#x27;_j = R_j kv_j，kv_j本身就是能直接用啊。 另外没有小矩阵使得kv_j再分化为k矩阵和v矩阵吗？ | HTML §5 |
| 10 | 2026-05-12T14:04:00.193Z | Compression position encoding | 这里的Indexer做128维的位置编码吗？那和主逻辑里面的64维rope不是对不上吗？ 位置编码是在压缩前加入还是压缩后假如？ | HTML §4.1-4.3 |
| 11 | 2026-05-12T14:07:24.055Z | attn_sink / Gated Attention | 对啊，但是这里的attn_sink不是contexture的，而是per head的。而 Gated Attention也是如此。你能从数学上对比、或者近似对比两者作用的异同吗？ | HTML §6 |
| 12 | 2026-05-12T14:17:31.492Z | RoPE / inverse RoPE / RoPER | 所以K和V前(512-64)是共享的？这里其实是K做了Rope之后再存KV Cache对吧。其实本质上V就是把kv后64维做inverse Rope之后，再当作v用。所以其实把kv cache... | HTML §5 |
| 13 | 2026-05-12T14:24:57.177Z | Compression position encoding | self.ape的size是什么样？ 排除前128个Token，这里的Position Index为什么要这样？ ratio=4: 0, 4, 8, 12, ... ratio=128: 0,... | HTML §4.1-4.3 |
| 14 | 2026-05-12T14:28:05.330Z | attn_sink / Gated Attention | Gated Attention本质上用在用g_h(x)来模拟logsumexp_i(s_i)？可以这样理解吗？从数学上 | HTML §6 |
| 15 | 2026-05-12T15:10:46.392Z | RoPE/RoPER + compressed anchors | V_eff(i, j) = R_{j-i} p_j里面加入相对位置旋转，这个数学表现会怎么样？之前有人干过吗？有没有Paper支撑。直觉上感觉很诡异啊。QK已经相对位置一次了，V还要相对位置一... | HTML §5, §4.1-4.3 |
| 16 | 2026-05-12T15:18:36.694Z | Compression position encoding | 我们考虑学习的时候的情况，0, 128, 256...，前128的位置都学过，但是类似于129、130这些位置都没有学习过啊，这个有问题吗？我的意思说这些129、130这些位置在训练的时候没有... | HTML §4.1-4.3 |
| 17 | 2026-05-12T15:20:29.871Z | RoPE / inverse RoPE / RoPER | V_eff(i,j) = R(t_j - i) p_j 能不能进一步分析一下这个数学性质和Insight。 以及RoPER这里面是否有Ablation Study支持这个 | HTML §5 |
| 18 | 2026-05-12T15:25:37.139Z | RoPE / inverse RoPE / RoPER | 其实在v做inverse rope的时候有两个选择，一个是保留相对位置，一个是去除位置啊，再乘以一个R(t_j)，不就是R(t_j-t_j)的单位阵了吗？为什么没有这样选择 | HTML §5 |
| 19 | 2026-05-12T15:29:43.072Z | RoPE / inverse RoPE / RoPER | 全面解读一下RoPER这个工作，以及相关的Ablation Study | HTML §5 |
| 20 | 2026-05-13T01:39:09.238Z | Report production request | 我希望将我们上述讨论的所有关于DSV4的设计，我每一个问题，你每一条回复，以及相关的背景知识例如mHC,RoPER等等，写成一个技术分析报告放在/Users/jyxc-dz-0100301/D... | HTML §1-12 + discussion audit |
| 21 | 2026-05-13T01:43:45.143Z | Report production request | PLEASE IMPLEMENT THIS PLAN: # DSV4 深度技术分析报告计划 ## Summary 创建一个中文深度长文式、单文件自包含的 HTML 报告： `/Users/jy... | HTML §1-12 + discussion audit |
| 22 | 2026-05-13T02:00:58.675Z | Report production request | # In app browser: - The user has the in-app browser open. - Current URL: file:///Users/jyxc-dz-0... | HTML §1-12 + discussion audit |
| 23 | 2026-05-13T02:31:25.481Z | Report production request | # In app browser: - The user has the in-app browser open. - Current URL: file:///Users/jyxc-dz-0... | HTML §1-12 + discussion audit |

## 原始问答

### Q1. Architecture overview

- 时间：`2026-05-11T10:36:51.987Z`
- HTML 覆盖位置：HTML §1-3

**User**

```text
请帮我全面解析DSV4的模型架构，一层层的，认真拆解相关的算子，而且输出的时候要是人话
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-11T10:37:03.462Z`_

```text
我会先用 Superpowers 的基础流程确认一下本轮该怎么读代码，然后直接钻进 `config.json`、`inference/model.py` 和 `inference/kernel.py`。目标不是堆术语，而是把 DSV4 从输入 token 到每层计算再到输出 logits 讲成可跟着走的“人话版”。
```

_timestamp: `2026-05-11T10:37:15.724Z`_

```text
我已经确认仓库就是模型权重、配置和一套轻量 inference 实现。接下来我会把架构事实锚在代码和配置上：先读模型超参，再顺着 `Transformer -> Block -> Attention/MoE/MLP` 走一遍。
```

_timestamp: `2026-05-11T10:37:35.839Z`_

```text
现在能看到几个关键点：这是 61 层 decoder-only MoE，隐藏维 7168，注意力 128 个头但 KV 只有一条“共享潜变量”，每 token 只激活 6 个路由专家。最有意思的地方是长上下文注意力：短期窗口 + 压缩 KV + 稀疏取 top-k，而不是每个 token 看完整 1M 上下文。
```

_timestamp: `2026-05-11T10:37:58.222Z`_

```text
小插曲：`DeepSeek_V4.pdf` 和 `model.safetensors.index.json` 看起来不是完整内容，而像是 Git LFS 指针文件，所以我不会把它们当成真实技术报告或权重索引来硬解读。架构解析会以 `README.md`、`config.json`、`inference/config.json` 和 inference 代码为准。
```

### Q2. General follow-up

- 时间：`2026-05-11T17:28:07.890Z`
- HTML 覆盖位置：HTML relevant section

**User**

```text
继续
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-11T17:28:25.650Z`_

```text
继续，我现在把它整理成可读版：不是按论文名词堆叠，而是按“数据进来以后到底被哪些模块怎么折腾”来讲。这里有一个细节要先说清：仓库里的 `DeepSeek_V4.pdf` 是 LFS 指针，不是真 PDF 内容，所以我会只基于本地可读的配置和 inference 实现下结论。
```

_timestamp: `2026-05-11T17:29:42.368Z`_

```text
下面这版按 inference 代码拆，不按营销话术拆。核心文件是 [config.json](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/config.json:1)、[inference/config.json](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/config.json:1)、[inference/model.py](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:769)、[inference/kernel.py](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/kernel.py:105)。

**一句话总览**

DSV4-Pro 是一个 decoder-only causal LM：输入 token 进 embedding，经过 61 层 Transformer block，每层都是“mHC 超连接 + 稀疏压缩注意力 + MoE 专家 FFN”，最后 RMSNorm + lm head 出下一个 token 的 logits。官方 README 说 Pro 是 1.6T 总参数、49B 激活参数、1M 上下文。

**关键规格**

| 项 | 数值 |
|---|---:|
| vocab | 129280 |
| hidden size | 7168 |
| 主干层数 | 61 |
| attention heads | 128 |
| head dim | 512 |
| RoPE dim per head | 64 |
| MoE routed experts | 384 |
| 每 token 激活 routed experts | 6 |
| shared expert | 1 |
| expert FFN hidden | 3072 |
| mHC lanes | 4 |
| 短窗口 | 128 tokens |
| 长上下文 | 1048576 tokens |
| 主体精度 | FP8 mixed |
| routed expert 精度 | FP4 |

**整体数据流**

```text
input_ids
  -> token embedding: [B, S, 7168]
  -> 复制成 4 条 mHC 隐状态: [B, S, 4, 7168]
  -> 61 个 Block:
       1. mHC 先把 4 条状态混成 1 条
       2. RMSNorm
       3. Attention
       4. mHC 再把 attention 输出和旧 4 条状态混回 4 条
       5. mHC 先混成 1 条
       6. RMSNorm
       7. MoE FFN
       8. mHC 再混回 4 条
  -> mHC head 把 4 条状态收成 1 条
  -> RMSNorm
  -> lm_head，只算最后一个位置的 logits
```

**mHC 是什么**

普通 Transformer 是：

```text
x = x + Attention(norm(x))
x = x + FFN(norm(x))
```

DSV4 这里不是一条残差线，而是维护 4 条并行的隐藏状态。每进 attention 或 FFN 前，模型会先学一个“怎么从 4 条里调一碗汤”的权重，把 4 条混成 1 条给子层算。子层算完后，再学一个“新结果怎么倒回 4 条状态里”的混合矩阵。

代码里每次 mHC 会生成三类东西：

```text
pre  : 4 个数，决定子层输入从 4 条旧状态各取多少
post : 4 个数，决定子层输出注入到 4 条新状态的力度
comb : 4x4 矩阵，决定 4 条旧状态之间怎么互相流动
```

`comb` 不是随便来的，会跑 Sinkhorn 归一化，让这个混合矩阵更像一个受约束的“信息搬运矩阵”。人话说：它不是简单残差，而是给信息开了 4 条车道，并且每层都动态调度这些车道怎么合流、分流。

**Attention：不是全量看 1M，而是“近处细看，远处压缩后挑着看”**

每层 attention 做的是 MLA 风格的低秩/潜变量注意力。

Query 路径：

```text
x: 7168
  -> wq_a: 7168 -> 1536
  -> RMSNorm
  -> wq_b: 1536 -> 128 heads * 512
  -> 每个 head 再做 RMS 标准化
  -> 最后 64 维加 RoPE
```

KV 路径很不一样。它不是每个 head 单独一份 K/V，而是：

```text
x: 7168
  -> wkv: 7168 -> 512
  -> RMSNorm
  -> 最后 64 维加 RoPE
  -> 前 448 维做 FP8 量化模拟
```

也就是说，每个 token 只有一个 512 维的 latent KV，然后所有 heads 用自己的 query 去读它。这是省 KV cache 的大头。

注意力可看的位置分两类：

```text
1. 最近 128 个 token：原始 KV，细看。
2. 更早的 token：先压缩成 KV block，再从压缩 block 里选一些看。
```

压缩比例按层变化：

```text
layer 0,1: ratio 128
layer 2..60: ratio 4 和 ratio 128 交替
MTP layer 61: ratio 0，只用 sliding window
```

主干 61 层里，ratio 128 有 31 层，ratio 4 有 30 层。可以粗略理解成：一半层做很重的远程压缩，一半层做更细颗粒度的远程检索。

**Compressor：怎么把很多 token 压成一个 KV**

Compressor 对一段 token 做两件事：

```text
kv    = wkv(x)
score = wgate(x) + learned positional bias ape
compressed_kv = sum(softmax(score) * kv)
```

不是简单平均，而是模型自己学“这一小段里哪些 token 更值得代表这段”。ratio=128 时，128 个 token 压成 1 个 KV。ratio=4 时，4 个 token 压成 1 个 KV，并且代码里还有 overlap 逻辑，让相邻压缩块衔接更平滑。

**Indexer：ratio=4 时怎么挑远处内容**

ratio=4 的层有一个 Indexer。它会用单独的小 query 和压缩 KV 打分，然后选 top-k 压缩位置：

```text
index_topk = 1024
index heads = 64
index head dim = 128
```

人话说：远处内容已经被切成很多压缩摘要，Indexer 先快速扫一遍摘要目录，挑 1024 个最像当前 query 需要的摘要，再交给真正 attention 细算。

**Sparse Attention kernel 真正在算什么**

`sparse_attn` 不是对所有历史 token 做 softmax，而是只 gather `topk_idxs` 指定的位置：

```text
score = q dot selected_kv / sqrt(512)
prob  = softmax(score)
out   = sum(prob * selected_kv)
```

它里面用了 FlashAttention 那类 online softmax：边扫边维护最大值和归一化和，避免把大矩阵摊开。还有一个 `attn_sink`，可以理解成每个 head 有一个“注意力泄洪口”：当可看的 token 都不太合适时，softmax 分母里还有一部分质量能流到 sink，稳定注意力。

算完 attention 后，还有个有趣动作：

```text
apply_rotary_emb(o[..., -64:], inverse=True)
```

也就是把输出最后 64 维的 RoPE 旋转反过来。因为 KV 的这部分带了位置信息，读出来以后要把当前位置的旋转影响消掉，回到普通 hidden 表示。

输出投影也不是一个普通大矩阵：

```text
128 heads 分成 16 组
每组 8 heads * 512 = 4096
每组先降到 o_lora_rank=1024
16 组拼起来: 16 * 1024 = 16384
再投回 7168
```

这就是 grouped low-rank output projection，省参数、省算力。

**MoE FFN：每个 token 找 6 个专家 + 1 个共享专家**

每层 FFN 是 MoE，不是 dense FFN。

Gate 流程：

```text
scores = x @ expert_gate_weight
scores = sqrt(softplus(scores))
```

前 3 层是 hash routing：专家编号主要由 token id 查表决定。后面的层是 score routing：从 384 个 routed experts 里选 top 6。选出来以后，用原始分数归一化，再乘 `route_scale=2.5` 当专家权重。

每个专家内部是 SwiGLU：

```text
gate = w1(x)
up   = w3(x)
gate/up 做 clamp，limit=10
hidden = silu(gate) * up
out = w2(hidden)
```

然后：

```text
MoE 输出 = 6 个 routed experts 的加权和 + 1 个 shared expert 输出
```

shared expert 的意义很直白：路由专家负责专门化，shared expert 保底处理所有 token 都需要的通用能力。

**底层算子**

`linear()` 会根据权重 dtype 分派：

```text
FP4 权重 -> act_quant -> fp4_gemm
FP8 权重 -> act_quant -> fp8_gemm
普通权重 -> torch F.linear
```

几个关键 kernel：

| 算子 | 人话解释 |
|---|---|
| `act_quant` | 把激活按 128 维一组量化成 FP8，并保存 scale |
| `fp4_act_quant` | 把激活按 32 维一组模拟成 FP4，主要用于 indexer/压缩路径 |
| `fp8_gemm` | FP8 激活乘 FP8 权重，scale 还原，FP32 累加 |
| `fp4_gemm` | FP8 激活乘 FP4 expert 权重，FP4 先转到可算格式，再按 scale 累加 |
| `sparse_attn` | 只对选中的 KV 位置做 attention |
| `hc_split_sinkhorn` | 给 mHC 生成 pre/post/comb，并把 comb 约束成稳定混合矩阵 |

**精度策略**

这模型不是“全 BF16”。更准确地说：

```text
大部分非专家权重: FP8
routed expert 权重: FP4
很多归一化、mHC、压缩打分: FP32/BF16 混合
GEMM 累加: FP32
输出/激活常回到 BF16
```

这背后的思路是：矩阵乘最贵，用 FP8/FP4 省显存和吞吐；容易不稳定的控制量，比如归一化、mHC 混合、压缩权重，用更高精度稳住。

**最后的 MTP**

代码里还有 1 个 `MTPBlock`，也就是 multi-token prediction 相关模块。它共享 embedding 和 head，会把当前 hidden 和下一个 token embedding 融合后再过一个 block，产出额外 logits。普通 `Transformer.forward()` 主路径没有返回 MTP logits，所以 inference demo 主要还是标准 next-token generation。

**最人话的总结**

DSV4-Pro 的核心不是“层数特别玄”，而是三个工程选择叠在一起：

1. 注意力不再傻看完整历史，而是最近 128 个细看，远处压缩成摘要再挑着看。
2. FFN 不再所有 token 走同一个大网络，而是 384 个专家里每次只叫 6 个，再加一个共享专家兜底。
3. 残差不再是一根线，而是 4 条信息车道，层层动态合流分流，减少深层网络里信息传坏、传散的问题。

所以它的味道是：用 MoE 扩大容量，用压缩稀疏注意力撑 1M 上下文，用 mHC 稳住 61 层里的信号传播，再用 FP8/FP4 把代价压下来。
```

### Q3. Hybrid Attention overview

- 时间：`2026-05-12T12:28:53.381Z`
- HTML 覆盖位置：HTML §4-6

**User**

```text
Attention这块详细解释一下
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T12:30:56.719Z`_

```text
当然。DSV4 的 Attention 可以理解成一句话：

**Query 很多头，KV 只有一份压缩潜变量；近处看原文，远处看摘要，而且只挑相关摘要看。**

下面按 [Attention.forward](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:484) 的真实顺序讲。

**1. 输入形状**

从 Block 进 Attention 前，mHC 已经把 4 条 hidden lane 混成了一条：

```text
x: [B, S, 7168]
```

这里 `B` 是 batch，`S` 是本次 forward 的 token 数。prefill 时 `S` 可以很长；decode 时通常 `S=1`。

**2. Query 路径：很多头**

代码里 Query 是低秩两段式：

```text
x
 -> wq_a: 7168 -> 1536
 -> RMSNorm
 -> wq_b: 1536 -> 128 * 512
 -> reshape: [B, S, 128, 512]
 -> 每个 head 再 RMS normalize
 -> 最后 64 维加 RoPE
```

人话说：模型不是直接从 7168 一步投到巨大 Q，而是先压到 `q_lora_rank=1536`，标准化，再展开成 128 个 attention heads。每个 head 是 512 维，其中最后 64 维专门吃位置信息 RoPE，前 448 维主要表示内容。

**3. KV 路径：只有一份 latent KV**

这块是重点。普通 MHA 往往每个 head 都有自己的 K/V；DSV4 这里是：

```text
x
 -> wkv: 7168 -> 512
 -> RMSNorm
 -> 最后 64 维加 RoPE
 -> 前 448 维做 FP8 量化模拟
```

输出形状是：

```text
kv: [B, S, 512]
```

注意，没有 `[128 heads]` 这一维。也就是说，128 个 query heads 都去读同一份 512 维 KV latent。这样 KV cache 会小很多，因为历史 token 不需要为每个 head 存一份 K/V。

这也是它能撑长上下文的基础之一。

**4. 近处窗口：最近 128 个 token 原样保留**

每层都有一个 sliding window：

```text
window_size = 128
```

模型始终保留最近 128 个 token 的原始 KV。因为近处上下文通常最重要，比如当前句子、刚才代码、局部推理链，不能压得太狠。

代码里 `get_window_topk_idxs()` 会为每个 query 生成“能看的近处位置”。

prefill 时，它保证每个 token 只能看自己之前的位置，不能偷看未来。decode 时，它用环形 cache：

```text
raw_kv_cache_position = start_pos % 128
```

也就是最近 128 个 KV 循环覆盖。

**5. 远处上下文：先压缩，再挑选**

如果只保留最近 128，那 1M 上下文就没意义了。所以 DSV4 还给远处 token 建了压缩 KV。

每层有一个 `compress_ratio`：

```text
ratio = 4   或   128
```

它的意思是：

```text
ratio=4   : 每 4 个 token 压成 1 个 compressed KV
ratio=128 : 每 128 个 token 压成 1 个 compressed KV
ratio=0   : 不用压缩，只看 sliding window
```

主干 61 层里：

```text
layer 0,1: ratio=128
layer 2..60: ratio=4 和 ratio=128 交替
```

所以有些层看远处比较粗，有些层看远处比较细。

**6. Compressor 到底怎么压缩**

Compressor 不是简单平均。它会学一个“这一段里谁更重要”的权重：

```text
kv    = wkv(x)
score = wgate(x) + ape
weight = softmax(score over chunk)
compressed_kv = sum(weight * kv)
```

这里 `ape` 是 compression 内部的 learned positional bias。人话说：如果 128 个 token 要压成 1 个摘要，模型会自己判断这 128 个 token 里哪些更该代表这一段，而不是傻乎乎平均。

ratio=4 时还有 overlap 逻辑，相邻压缩块会共享一点边界信息，避免“四个一组”切得太硬。

**7. ratio=128：远处摘要基本都可以看**

ratio=128 的层，1M token 最多压成：

```text
1048576 / 128 = 8192 个 compressed KV
```

这个数量不算太离谱，所以代码里基本按压缩块位置生成可看的 compressed indices。也就是：远处很粗，但覆盖广。

人话说：这类层像是在读一本超长书的目录和章节摘要。

**8. ratio=4：远处摘要更多，所以先用 Indexer 挑 top-k**

ratio=4 会产生太多 compressed KV：

```text
1048576 / 4 = 262144 个 compressed KV
```

全看还是太贵。所以 ratio=4 的层会启用 `Indexer`。

Indexer 做的是一个轻量检索：

```text
query -> 小的 index query
compressed kv -> 小的 index kv
score = query 和 compressed kv 的相关性
topk = 选最相关的 1024 个 compressed positions
```

配置里：

```text
index_topk = 1024
index_n_heads = 64
index_head_dim = 128
```

所以 ratio=4 层的注意力范围大概是：

```text
最近 128 个原始 token
+ 远处 1024 个被挑中的 compressed KV
```

人话说：ratio=4 的层不是把整本书都读一遍，而是先用检索器翻目录，挑 1024 个最可能有用的段落摘要，再认真看。

**9. sparse_attn：只对选中的 KV 算 attention**

最终 Attention 不会形成完整的：

```text
[B, heads, S, all_history]
```

这种超大 attention 矩阵。

它会拿到 `topk_idxs`，只 gather 这些位置：

```text
selected_kv = kv_cache[topk_idxs]
score = q · selected_kv / sqrt(512)
prob = softmax(score)
out = sum(prob * selected_kv)
```

实现上在 [sparse_attn](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/kernel.py:355) 里。kernel 用 online softmax，边算边归一化，类似 FlashAttention 的思路，不把完整分数矩阵落到显存里。

**10. attn_sink：注意力的“缓冲槽”**

每个 head 有一个 learnable `attn_sink`：

```text
attn_sink: [128]
```

在 sparse attention 里，它不会贡献 value，但会进入 softmax 分母。

直观理解：如果当前 query 对所有可见 KV 都不是很想看，attention 不必被迫把概率硬塞给某个 token，可以把一部分概率质量“沉”到 sink 里。这样长上下文稀疏检索时更稳定。

**11. 为什么输出还要 inverse RoPE**

注意力输出 `o` 是 selected KV 的加权和，而 KV 最后 64 维被 RoPE 旋转过。算完之后代码做：

```text
apply_rotary_emb(o[..., -64:], freqs_cis, inverse=True)
```

也就是把输出最后 64 维反向旋转回来。

人话说：KV 带着位置信息参与匹配，这是好事；但回到 hidden state 时，模型希望得到更“内容态”的表示，所以把当前 query 位置的旋转影响撤掉。

**12. Output projection：分组低秩投影**

attention 输出形状：

```text
o: [B, S, 128, 512]
```

直接摊平就是：

```text
128 * 512 = 65536
```

如果直接投回 7168，矩阵会很大。DSV4 做分组低秩：

```text
128 heads 分成 16 组
每组 8 heads
每组输入维度 = 8 * 512 = 4096
每组先投到 1024
16 组拼起来 = 16384
再投回 7168
```

也就是：

```text
[B, S, 128, 512]
 -> [B, S, 16, 4096]
 -> wo_a: 每组 4096 -> 1024
 -> [B, S, 16384]
 -> wo_b: 16384 -> 7168
```

这一步省了大量参数和计算。

**13. Prefill 和 Decode 的差别**

prefill，也就是第一次吃 prompt：

```text
输入一整段 prompt
生成当前段内每个位置的近窗口 indices
生成 compressed KV
当前 attention 可以看 raw KV + compressed KV
同时把最近 128 个 raw KV 和 compressed KV 写进 cache
```

decode，也就是一个 token 一个 token 生成：

```text
当前 token 的 raw KV 写入环形 window cache
如果凑够 ratio，就生成一个新的 compressed KV
topk_idxs 指向 window cache + compressed cache
只算当前 token 的 sparse attention
```

所以长文本推理时，每生成一个 token，不需要回头重新扫 1M token；大部分历史已经变成 compressed cache 了。

**最核心的直觉**

DSV4 Attention 不是“注意力变魔法”，而是很工程化的三层省法：

```text
第一层省：KV 不是每个 head 一份，而是一份 512 维 latent KV。
第二层省：最近 128 个 token 原样看，远处 token 压成摘要。
第三层省：摘要太多时，再用 Indexer 挑 top-k，不全看。
```

所以它的 attention 更像一个人读长材料：

```text
眼前这一段逐字看；
前面很远的内容看摘要；
摘要太多时先检索，再重点看相关部分。
```

这就是 DSV4 长上下文效率的主要来源。
```

### Q4. Hybrid Attention / Indexer / sparse_attn

- 时间：`2026-05-12T12:48:02.938Z`
- HTML 覆盖位置：HTML §4

**User**

```text
这里的ratio=4、ratio=128是怎么交错的。 ratio=4 启用的Indexer是什么？和DSA一样吗？在代码中如何体现的？sparse_attn是只服务于ratio=4吗？128每块和4每块都是硬边界吗？
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T12:49:16.023Z`_

```text
是这样交错的，很规则：

```text
主干 61 层，也就是 layer 0..60：

layer 0  : ratio=128
layer 1  : ratio=128
layer 2  : ratio=4
layer 3  : ratio=128
layer 4  : ratio=4
layer 5  : ratio=128
...
layer 59 : ratio=128
layer 60 : ratio=4
```

也就是前两层都是 `128`，从第 2 层开始 `4/128/4/128...` 交错。配置里最后还有一个 `ratio=0`，那是给 MTP layer 61 用的，不属于 61 层主干。

代码体现位置：

```python
self.compress_ratio = args.compress_ratios[layer_id]

if self.compress_ratio:
    self.compressor = Compressor(args, self.compress_ratio, self.head_dim)
    if self.compress_ratio == 4:
        self.indexer = Indexer(args, self.compress_ratio)
    else:
        self.indexer = None
```

也就是说：

```text
ratio=4   -> Compressor + Indexer
ratio=128 -> Compressor，无 Indexer
ratio=0   -> 不做压缩，只看 sliding window
```

在 [inference/model.py](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:453)。

**Indexer 是什么**

Indexer 只在 `ratio=4` 的 attention 层启用。它不是最终 attention 本体，而是一个“先帮 attention 找远处候选块”的轻量检索器。

ratio=4 时，远处 compressed KV 太多：

```text
1M tokens / 4 = 262144 个 compressed block
```

如果全放进 sparse attention，还是贵。所以 Indexer 做一遍便宜的打分，挑：

```text
index_topk = 1024
```

个 compressed KV 位置。

代码流程大概是：

```python
q = self.wq_b(qr)                     # index query
apply_rotary_emb(q[..., -rd:], ...)
q = rotate_activation(q)
fp4_act_quant(q, ...)

self.compressor(x, start_pos)         # 建 index 用的 compressed kv

index_score = torch.einsum(
    "bshd,btd->bsht",
    q,
    self.kv_cache[:bsz, :end_pos // ratio],
)

index_score = (index_score.relu_() * weights.unsqueeze(-1)).sum(dim=2)
topk_idxs = index_score.topk(min(self.index_topk, end_pos // ratio), dim=-1)[1]
```

位置在 [Indexer.forward](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:402)。

人话说：Indexer 是一个小号 attention/scorer，专门给远处压缩块排序。它先问：“哪些历史摘要可能有用？”然后把这些编号交给真正的 `sparse_attn`。

**和 DSA 一样吗**

如果你说的 DSA 是“动态稀疏注意力/动态选 top-k KV”的大思路，那它很像：都是先选候选，再只对候选做 attention。

但在这份代码里，它不是一个单独叫 DSA 的实现。它更准确叫：

```text
Compressed Sparse Attention 的 learned Indexer + sparse_attn kernel
```

两个特点比较 DSV4：

```text
1. Indexer 选的是 compressed KV block，不是原始每个 token。
2. 真正 attention 看的集合 = 最近 128 个原始 KV + 远处 compressed KV 候选。
```

所以别把它简单等同成“普通 DSA 对原 token 做 top-k”。

**sparse_attn 只服务 ratio=4 吗**

不是。`sparse_attn` 是所有 Attention 层最终都用的核心 kernel。

在 [Attention.forward](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:507)：

```python
topk_idxs = get_window_topk_idxs(...)

if self.compress_ratio:
    if self.indexer is not None:
        compress_topk_idxs = self.indexer(...)
    else:
        compress_topk_idxs = get_compress_topk_idxs(...)
    topk_idxs = torch.cat([topk_idxs, compress_topk_idxs], dim=-1)

o = sparse_attn(q, kv_or_cache, self.attn_sink, topk_idxs, self.softmax_scale)
```

也就是说：

```text
ratio=4   : sparse_attn 看 window indices + Indexer 挑出的 compressed indices
ratio=128 : sparse_attn 看 window indices + 规则生成的 compressed indices
ratio=0   : sparse_attn 只看 window indices
```

`sparse_attn` 不关心这些 index 是怎么来的，它只负责：“你给我哪些位置，我就只对哪些位置算 attention。”

**128 每块和 4 每块是硬边界吗**

`ratio=128` 基本是硬边界：每 128 个 token 聚成一个 compressed KV。decode 时也是凑满 128 个 token 才产出一个压缩块。

`ratio=4` 不是纯硬边界，因为代码里有 overlap：

```python
self.overlap = compress_ratio == 4
```

ratio=4 时会走 `overlap_transform()`，把上一块和当前块的信息拼到一起做压缩。直观上是：

```text
普通 ratio=4:
[0 1 2 3] -> block A
[4 5 6 7] -> block B

DSV4 ratio=4 with overlap:
除了当前 4 个，还会把相邻窗口的一部分混进来，
让边界附近的信息不要被一刀切断。
```

对应位置在 [Compressor](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:279)。

所以结论是：

```text
ratio=128：硬块压缩，粗粒度、覆盖广。
ratio=4：小块压缩，但带 overlap，边界更软；再用 Indexer 选 top-k。
```

最简图：

```text
每层 attention 都看：
最近 128 raw KV

ratio=128 层额外看：
所有/规则可见的 128-token compressed KV

ratio=4 层额外看：
4-token overlapped compressed KV 中，被 Indexer 选出的 top 1024 个
```
```

### Q5. attn_sink / Gated Attention

- 时间：`2026-05-12T12:49:16.113Z`
- HTML 覆盖位置：HTML §6

**User**

```text
为什么会采用attn_sink？Gated Attention不是会缓解这个问题吗？采用Gated Attention了吗？
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T12:50:12.648Z`_

```text
会用 `attn_sink`，主要是因为 **sparse attention 有一个“候选集可能不靠谱”的问题**。

普通 softmax attention 有个硬约束：

```text
所有可见 KV 的 attention prob 加起来必须等于 1
```

如果当前 query 其实对这些 KV 都不感兴趣，它也必须把 100% 概率分给其中一些 token。这在 DSV4 这种结构里更明显，因为 attention 看的不是全历史，而是：

```text
最近 128 个 raw KV
+ 一批 compressed KV
+ ratio=4 时 Indexer 挑出来的 top-k compressed KV
```

如果 Indexer 没挑到真正有用的远处块，或者 compressed block 本身只是粗摘要，模型就可能被迫关注一些“不该看的东西”。

`attn_sink` 给 softmax 加了一个“空选项”。

代码在 [inference/kernel.py](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/kernel.py:345)：

```python
sum_exp[i] += T.exp(attn_sink[i] - scores_max[i])
acc_o[i, j] /= sum_exp[i]
```

注意它只进分母，不进 value 加权和。数学上等价于：

```text
额外加一个 key，logit = attn_sink
但它的 value = 0
```

所以如果真实 KV 都不值得看：

```text
attention mass 可以流向 sink
输出幅度变小
不会硬把噪声 KV 混进来
```

每个 head 有一个自己的 sink 参数：

```python
self.attn_sink = nn.Parameter(torch.empty(self.n_local_heads, dtype=torch.float32))
```

在 [Attention.__init__](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:456)。

**Gated Attention 会不会缓解？**

会缓解一部分，但不是同一个问题。

如果你说的 Gated Attention 是常见的：

```text
attn_out = gate(x) * attention(x)
```

这种 gate，它是在 attention 输出之后控制“要不要把这个结果注入残差”。它能把坏的 attention 输出压小。

但 `attn_sink` 是在 softmax 内部解决问题：

```text
在分配注意力概率时，就允许“这些 KV 都不看”
```

区别很关键：

```text
Gated Attention：事后刹车
attn_sink：softmax 分配时就给一个 none-of-the-above
```

对于稀疏检索注意力，`attn_sink` 更直接。因为问题不是“attention 输出要不要进残差”，而是“候选 KV 集合里可能根本没有好对象，但 softmax 还被迫选一个”。

**DSV4 采用 Gated Attention 了吗？**

从这份 inference 代码看，Attention 本体没有采用常规定义的 Gated Attention。也就是说，没有看到类似：

```python
gate = sigmoid(Wg(x))
attn_out = gate * attn_out
```

这种 attention output gate。

但它有几个“gate-like”的东西：

```text
1. Compressor 里有 wgate，用来决定一组 token 压缩时谁权重大。
2. MoE 里有 Gate，用来选专家。
3. mHC 里有 pre/post/comb，用来控制 attention/FFN 输出怎么注入 4 条 hidden lane。
```

其中 mHC 的 `post` 确实有点像“子层输出注入门控”，但它不是传统 Gated Attention，也不在 attention softmax 里面。

所以准确说：

```text
DSV4 Attention 使用了 attn_sink。
DSV4 没有在 Attention 模块里使用常规 Gated Attention。
mHC 在 Attention 外层提供了更高级的动态残差/注入控制。
```

一句话：`attn_sink` 负责“别被迫看坏候选”，mHC 负责“attention 算完以后怎么进主干”。它们解决的是相邻但不相同的问题。
```

### Q6. RoPE / inverse RoPE + grouped output projection

- 时间：`2026-05-12T12:52:37.734Z`
- HTML 覆盖位置：HTML §5, §8

**User**

```text
11. 为什么输出还要 inverse RoPE
这一块完全没有读懂，现在不是已经partial rope了吗

12. Output projection：分组低秩投影
这一步最好写一下数学公式
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T12:54:47.085Z`_

```text
对，正好这两块确实容易绕。关键点是：**DSV4 的 KV 不是普通 K/V 分离，而是一个 latent KV 同时当 key 和 value 用**。这会让 inverse RoPE 变得必要。

**11. 为什么输出还要 inverse RoPE**

代码里是这几步：

```python
apply_rotary_emb(q[..., -rd:], freqs_cis)
apply_rotary_emb(kv[..., -rd:], freqs_cis)

o = sparse_attn(q, kv, ...)
apply_rotary_emb(o[..., -rd:], freqs_cis, True)
```

`rd = rope_head_dim = 64`。

你说得对，它已经是 **partial RoPE** 了：512 维 head 里只有最后 64 维做 RoPE，前 448 维不转。

但 partial RoPE 只回答：

```text
哪些维度要旋转？
```

inverse RoPE 回答的是：

```text
attention 输出后，这些被旋转过的 value 维度要不要转回当前 token 的坐标系？
```

普通 Transformer 里一般是：

```text
Q 做 RoPE
K 做 RoPE
V 不做 RoPE
```

所以 attention 输出是：

```text
out_i = sum_j attn_ij * V_j
```

因为 `V_j` 没被 RoPE 转过，所以不需要 inverse。

但 DSV4 这里没有单独的 V。代码里的 `kv` 既参与打分，也被当 value 加权求和。也就是说：

```text
score 用 q 和 kv 算
out  也用 kv 加权求和
```

所以 `kv` 最后 64 维被 RoPE 转过以后，它作为 value 被加权输出时，也把旋转带进来了。

用公式看更清楚。只看 RoPE 那 64 维：

```text
q'_i  = R_i q_i
kv'_j = R_j kv_j
```

attention score 里有：

```text
(q'_i)^T kv'_j
= (R_i q_i)^T (R_j kv_j)
= q_i^T R_i^T R_j kv_j
= q_i^T R_{j-i} kv_j
```

这很好，它让打分依赖相对位置 `j-i`。

但输出是：

```text
o'_i = sum_j attn_ij * kv'_j
     = sum_j attn_ij * R_j kv_j
```

问题来了：这里每个 value 都在自己的绝对位置坐标系里，`j=10` 的 value 被 `R_10` 转过，`j=1000` 的 value 被 `R_1000` 转过。加在一起后，这 64 维是混着绝对位置旋转的。

所以 DSV4 再对当前 query 位置 `i` 做 inverse：

```text
o_i = R_i^{-1} o'_i
    = sum_j attn_ij * R_i^{-1} R_j kv_j
    = sum_j attn_ij * R_{j-i} kv_j
```

这一步不是把位置信息抹掉，而是把它变成“相对当前 token 的位置”。人话说：

```text
不要让输出停留在历史 token 各自的绝对坐标系里；
把它统一拉回当前 token 的坐标系。
```

所以 partial RoPE 和 inverse RoPE 不冲突：

```text
partial RoPE：只转最后 64 维，前 448 维不动。
inverse RoPE：attention 输出后，也只把最后 64 维转回当前坐标系。
```

**12. Output projection 的数学公式**

attention 输出先是：

```text
O ∈ R^{B x S x 128 x 512}
```

直接摊平就是：

```text
128 * 512 = 65536
```

如果直接做普通输出投影，就是：

```text
Y = O_flat W_o^T
W_o ∈ R^{7168 x 65536}
```

这个矩阵很大。

DSV4 把 128 个 heads 分成 16 组：

```text
G = 16
每组 8 个 heads
每组维度 = 8 * 512 = 4096
```

令第 `g` 组的 attention 输出摊平为：

```text
u_g ∈ R^{4096}
```

第一阶段，每组独立低秩压缩：

```text
z_g = A_g u_g
A_g ∈ R^{1024 x 4096}
z_g ∈ R^{1024}
```

16 组拼起来：

```text
z = concat(z_1, z_2, ..., z_16)
z ∈ R^{16 * 1024} = R^{16384}
```

第二阶段，再投回 hidden size：

```text
y = B z
B ∈ R^{7168 x 16384}
y ∈ R^{7168}
```

合起来就是：

```text
y = B · concat(A_1 u_1, A_2 u_2, ..., A_16 u_16)
```

或者写成块矩阵：

```text
y = B · blockdiag(A_1, A_2, ..., A_16) · O_flat
```

代码对应这里：

```python
o = o.view(bsz, seqlen, self.n_local_groups, -1)

wo_a = self.wo_a.weight.view(
    self.n_local_groups,
    self.o_lora_rank,
    -1
)

o = torch.einsum("bsgd,grd->bsgr", o, wo_a)
x = self.wo_b(o.flatten(2))
```

对应公式：

```text
o_{b,s,g,r} = sum_d O_{b,s,g,d} * A_{g,r,d}

x_{b,s,m} = sum_{g,r} o_{b,s,g,r} * B_{m,g,r}
```

参数量直觉：

```text
普通 W_o:
7168 * 65536 ≈ 469.8M

DSV4 grouped low-rank:
16 * 1024 * 4096 + 7168 * 16384
≈ 67.1M + 117.4M
≈ 184.5M
```

所以这一步本质是：**先在每组 heads 内压缩，再允许跨组混合回 7168 维**。它不是简单砍维度，而是用一个结构化低秩分解替代巨大的 `W_o`。
```

### Q7. Hybrid Attention / Indexer / sparse_attn

- 时间：`2026-05-12T13:01:40.030Z`
- HTML 覆盖位置：HTML §4

**User**

```text
DSV4 ratio=4 with overlap:
这个细节逻辑展开一下。

sparse attention的实现逻辑展开一下。

indexer部分用数学语言描述一下。
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T13:05:29.646Z`_

```text
好，我们把这三块拆到“能照着代码复现”的程度。

**1. ratio=4 的 Overlap**

代码在 [Compressor.overlap_transform](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:307)。

当 `compress_ratio == 4` 时：

```python
self.overlap = True
coff = 2
wkv:   7168 -> 2 * head_dim
wgate: 7168 -> 2 * head_dim
```

也就是说，每个 token 会产生两份压缩候选：

```text
kv_t = [a_t, b_t]
score_t = [alpha_t, beta_t]
a_t, b_t ∈ R^d
```

其中 attention 主 compressor 里 `d=512`，indexer compressor 里 `d=128`。

把 token 每 4 个分一组：

```text
C0 = [0,1,2,3]
C1 = [4,5,6,7]
C2 = [8,9,10,11]
```

普通硬切会是：

```text
compressed_0 <- C0
compressed_1 <- C1
compressed_2 <- C2
```

但 ratio=4 overlap 实际是：

```text
compressed_0 <- C0 的 b 半边
compressed_1 <- C0 的 a 半边 + C1 的 b 半边
compressed_2 <- C1 的 a 半边 + C2 的 b 半边
compressed_3 <- C2 的 a 半边 + C3 的 b 半边
```

所以每个 4-token chunk 会影响两个相邻 compressed block：

```text
C1 会进入 compressed_1 的 b 半边
C1 也会进入 compressed_2 的 a 半边
```

公式写成这样。令 `r=4`，第 `k` 个 chunk 是 `C_k`。对 `k > 0`：

```text
L_k = {a_t | t ∈ C_{k-1}} ∪ {b_t | t ∈ C_k}

c_k = Σ_{v ∈ L_k} softmax(score_v) * v
```

更细一点：这里的 softmax 是沿候选 token 维度做的，而且 score 和 kv 都是向量，所以它实际是 **逐通道 gating**，不是每个 token 一个标量权重。

代码对应：

```python
new_tensor[:, :, ratio:] = tensor[:, :, :, d:]
new_tensor[:, 1:, :ratio] = tensor[:, :-1, :, :d]
kv = (kv * score.softmax(dim=2)).sum(dim=2)
```

所以结论是：

```text
ratio=4 仍然每 4 个 token 产出 1 个 compressed KV；
但 compressed KV 的内容不是硬边界，它有 8-token 左右的重叠感受野。
```

`ratio=128` 没有这个 overlap，基本就是每 128 个 token 做一个 learned weighted pooling。

**2. sparse_attn 的实现逻辑**

代码在 [sparse_attn_kernel](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/kernel.py:277)。

输入是：

```text
q:         [B, S, H, D]
kv:        [B, N, D]
topk_idxs: [B, S, K]
attn_sink: [H]
```

它不管这些 idx 来自 window、ratio=128，还是 ratio=4 indexer。它只做一件事：

```text
对 topk_idxs 指定的位置算 attention。
```

数学上，对 batch `b`、位置 `s`、head `h`：

```text
I = topk_idxs[b, s]

score_i = q[b,s,h]^T kv[b,i] / sqrt(D),  i ∈ I

denom = exp(attn_sink[h]) + Σ_i exp(score_i)

out[b,s,h] = Σ_i exp(score_i) * kv[b,i] / denom
```

注意 `attn_sink` 只进分母，不进分子，等价于加了一个 value 为 0 的 dummy key。

实现上它按 64 个 index 一块处理：

```text
1. 读入当前 64 个 topk index
2. gather 对应 kv
3. q @ kv 得到 [heads, 64] 分数
4. 做 online softmax，维护 running max 和 running sum
5. 累加 exp(score) * kv
6. 所有块扫完后，加 attn_sink 的分母项
7. 除以 denom 得到 out
```

online softmax 的原因很实在：不用把 `[S, H, K]` 的完整 attention 分数矩阵落显存，数值也稳定。

`sparse_attn` 不是只给 ratio=4 用。三种情况都用：

```text
ratio=4   : window raw KV + indexer 选出的 compressed KV
ratio=128 : window raw KV + 规则可见的 compressed KV
ratio=0   : 只有 window raw KV
```

**3. Indexer 的数学描述**

代码在 [Indexer.forward](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:402)。它只在 `ratio=4` 层启用。

Indexer 的目标不是算最终 attention，而是给远处 compressed blocks 排名，选 top 1024 个 block id。

先拿 attention 里的低秩 query 中间态：

```text
qr_s = RMSNorm(Wq_a x_s) ∈ R^1536
```

Indexer 自己生成小 query：

```text
Q^I_{s,h} = RoPE(W^I_q qr_s) ∈ R^128
h = 1..64
```

然后做 Hadamard rotation 和 FP4 quant simulation，这是为了贴近低精度部署：

```python
q = rotate_activation(q)
fp4_act_quant(q, ...)
```

Indexer 还有自己的 compressor，生成用于检索的 compressed key：

```text
K^I_t ∈ R^128
```

这个 compressor 也是 ratio=4 overlap 版本，但 `head_dim=128`，不是主 attention 用的 512 维 KV。

然后它给每个 query token 和每个 compressed block 打分：

```text
a_{s,h} = W_weight,h x_s / sqrt(128 * 64)

score_{s,t} = Σ_h a_{s,h} * ReLU( <Q^I_{s,h}, K^I_t> )
```

代码对应：

```python
weights = self.weights_proj(x) * (self.softmax_scale * self.n_heads ** -0.5)

index_score = torch.einsum("bshd,btd->bsht", q, self.kv_cache)
index_score = (index_score.relu_() * weights.unsqueeze(-1)).sum(dim=2)
```

接着做 causal mask，防止看未来 compressed block：

```text
如果 block t 对当前 token s 还不该可见：
score_{s,t} = -inf
```

最后：

```text
J_s = TopK_t(score_{s,t}, 1024)
```

返回这些 block id，加上 offset，让它们指向主 attention 的 KV cache。

一个容易漏的点：**Indexer 选 block，用的是自己的 128 维 index KV；最终 sparse_attn 真正读取的，是主 Attention compressor 生成的 512 维 compressed KV。** Indexer 是检索器，不是最终 attention。
```

### Q8. attn_sink / Gated Attention

- 时间：`2026-05-12T13:05:29.743Z`
- HTML 覆盖位置：HTML §6

**User**

```text
在DSV4的情况下Gated Attention和attn_sink的区别从算法Insight的角度详细对比一下，理论上一旦KV选得不对，也可以用Gated把那个head给压下去
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T13:07:16.431Z`_

```text
你这个质疑是对的：**从函数表达能力上，Gated Attention 确实可以把坏 head 压下去。** 但 DSV4 用 `attn_sink` 的 insight 不是“gate 做不到”，而是：**在稀疏检索注意力里，问题发生在 softmax 归一化内部，sink 是更直接的归纳偏置。**

先写成公式。

普通 sparse attention：

```text
s_i = q^T k_i / sqrt(d), i ∈ selected KV
Z = Σ_i exp(s_i)

o = Σ_i exp(s_i) / Z · v_i
```

问题是：哪怕 selected KV 都很烂，概率也必须加和为 1。

`attn_sink` 后：

```text
Z_sink = exp(a_h) + Σ_i exp(s_i)

o = Σ_i exp(s_i) / Z_sink · v_i
```

其中 `a_h` 是每个 head 一个 learned sink logit。它等价于加了一个：

```text
key logit = a_h
value = 0
```

所以它也可以改写成：

```text
o_sink = γ_sink · o_normal

γ_sink = Z / (Z + exp(a_h))
       = sigmoid(logsumexp(s_i) - a_h)
```

这点很关键：**attn_sink 本质上就是一个由 attention logits 自动决定的 confidence gate**。如果选中的 KV 整体分数低，`logsumexp(s_i)` 小，`γ_sink` 就小；如果有强匹配 KV，`γ_sink` 接近 1。

Gated Attention 通常是：

```text
o_gate = γ(x) · o_normal
```

或者更细一点：

```text
o_gate = γ(x, q) · Attention(q, K, V)
```

区别在 `γ` 从哪里来。

`attn_sink` 的 gate 来自：

```text
当前 query 和实际 selected KV 的匹配强度
```

普通 Gated Attention 的 gate 多数来自：

```text
当前 hidden/query 自身
```

所以当 KV 是 Indexer 挑出来的，候选集质量是一个 `q + selected K` 的联合属性。只看 `x` 或 `q` 的 gate 不一定知道“这次检索翻车了”。它可能知道“这个 head 现在重要”，但不知道“这个 head 当前拿到的候选 KV 靠不靠谱”。

所以你说的“KV 选得不对，用 gated 把 head 压下去”理论上成立，但要求 gate 能看到足够信息，比如：

```text
top-k logits
score entropy
logsumexp
selected KV 分布
attention 输出置信度
```

一旦 gate 用了这些东西，它其实就已经很接近 `attn_sink` 这种 score-aware confidence gate 了。

**算法 Insight 上的差异**

`attn_sink` 解决的是 softmax 的“强制分配概率”问题。

```text
没有 sink：
这些 KV 都不该看，也必须选一个或几个看。

有 sink：
这些 KV 都不该看时，可以把概率质量分给 value=0 的空位。
```

Gated Attention 解决的是“attention 结果要不要注入主干”的问题。

```text
attention 已经从候选 KV 中混出了一个向量；
gate 再决定这个向量进不进后续网络。
```

所以可以这么理解：

```text
attn_sink：在选 KV 权重时提供 none-of-the-above。
Gated Attention：在 attention 输出后做事后刹车。
```

二者不是谁完全替代谁，而是作用点不同。

在 DSV4 场景里，`attn_sink` 特别合适，因为 sparse attention 的候选集来自：

```text
最近 128 raw KV
+ ratio=128 的压缩块
+ ratio=4 的 Indexer top-k 压缩块
```

这里候选集不是完整历史。softmax over selected KV 会天然过度自信。`attn_sink` 给每个 head 一个 baseline：只有当 selected KV 的总匹配强度超过这个 baseline，真实 KV 才拿到大质量。

**那 DSV4 采用 Gated Attention 了吗？**

从这份代码看，Attention 内部没有传统 Gated Attention：

```text
没有 gate = sigmoid(Wx)
没有 attn_out = gate * attn_out
```

代码里有的是 [attn_sink](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:456)，并在 [sparse_attn_kernel](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/kernel.py:345) 只加入 softmax 分母。

但 DSV4 外层有 mHC，确实有点像更高层的动态注入控制。它可以调 attention 输出怎么进入 4 条 hidden lane。不过 mHC 是 attention 之后、block 级别的混合，不是 head 内部的 KV 置信度机制。

**限制也要说清楚**

`attn_sink` 不是万能的。如果 Indexer 选错了，但错误 KV 恰好和 query 点积很高，那么：

```text
logsumexp(s_i) 仍然高
γ_sink 也会高
```

这时 sink 不会救它。Gated Attention 也未必救，除非 gate 额外学到了这种 false positive 模式。

所以更准确的结论是：

```text
attn_sink 擅长处理“候选集整体不可信/匹配弱”的情况；
Gated Attention 擅长处理“这个 attention head/通道整体该不该贡献”的情况。
```

在 DSV4 这种稀疏压缩注意力里，`attn_sink` 是一个很便宜、很贴问题的校准器：它让 sparse softmax 不必假装“我挑到的这些 KV 里面一定有答案”。
```

### Q9. RoPE / inverse RoPE / RoPER

- 时间：`2026-05-12T13:08:10.277Z`
- HTML 覆盖位置：HTML §5

**User**

```text
inverse RoPE这块还是confuse，kv'_j = R_j kv_j，kv_j本身就是能直接用啊。
另外没有小矩阵使得kv_j再分化为k矩阵和v矩阵吗？
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T13:09:12.040Z`_

```text
对，你卡住的点很准：**如果 `kv_j` 本身能直接当 value 用，那为什么不直接用？为什么要先 `R_j kv_j`，算完再 inverse？**

答案是：在这份 DSV4 inference 代码里，**它没有显式分出 `K_j` 和 `V_j` 两套东西**。同一个 `kv_j` 既当 key 用来匹配，也当 value 用来被加权求和。所以一旦为了 key 匹配给 `kv_j` 加了 RoPE，它作为 value 被求和时也带着 RoPE。inverse RoPE 就是为了解这个副作用。

代码上就是：

```python
kv = self.wkv(x)              # 7168 -> 512
kv = self.kv_norm(kv)
apply_rotary_emb(kv[..., -rd:], freqs_cis)

o = sparse_attn(q, kv, ...)
apply_rotary_emb(o[..., -rd:], freqs_cis, True)
```

位置在 [inference/model.py](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:501)。

**为什么不直接用未旋转的 `kv_j` 当 value？**

普通 attention 是这样：

```text
K_j = R_j k_j
V_j = v_j
score_ij = (R_i q_i)^T (R_j k_j)
out_i = Σ softmax(score_ij) · v_j
```

这里 K 和 V 分开，所以 V 没转，不需要 inverse。

但 DSV4 这里更像：

```text
K_j = R_j kv_j
V_j = R_j kv_j
```

因为 `sparse_attn(q, kv, ...)` 里面同一个 `kv` 既参与 dot product，又参与输出求和。于是输出变成：

```text
o'_i = Σ α_ij · R_j kv_j
```

这时候 `o'_i` 的最后 64 维很别扭：它是很多不同位置坐标系的向量相加。第 10 个 token 是 `R_10 kv_10`，第 1000 个 token 是 `R_1000 kv_1000`，直接加在一起会把绝对位置旋转混进 value 表示里。

所以它再乘当前 query 位置的反旋转：

```text
o_i = R_i^{-1} o'_i
    = Σ α_ij · R_i^{-1} R_j kv_j
    = Σ α_ij · R_{j-i} kv_j
```

这一步的意义不是“还原成原始 `kv_j`”，而是：

```text
把所有被读出来的 value 统一到当前 token i 的相对坐标系。
```

所以你说的 `kv_j` 本身当然能用，但这份代码为了省 K/V 分离，把 `kv_j` 也拿去做带 RoPE 的 key 了；既然 value 跟着被转了，输出端就要转回来。

**那有没有小矩阵把 `kv_j` 再分成 K 和 V？**

在这份 inference 实现里，没有。

Attention 里只有：

```python
self.wkv = Linear(self.dim, self.head_dim)  # 7168 -> 512
```

没有看到类似：

```python
wk = ...
wv = ...
kv_to_k = ...
kv_to_v = ...
```

也没有在 `sparse_attn` 前把 `kv` 分化成单独的 `k` 和 `v`。`sparse_attn` 的签名也是：

```python
sparse_attn(q, kv, attn_sink, topk_idxs, softmax_scale)
```

不是：

```python
sparse_attn(q, k, v, ...)
```

所以至少按当前代码：**没有显式 K/V 分化矩阵**。

更细地说，可能在架构设计上可以把某些 K/V 变换“吸收”到 query 投影或 output projection 里，从而推理时不显式 materialize K/V 两套矩阵。但就这份代码而言，实际执行路径就是：一个 512 维 latent KV，同时当 key 和 value。RoPE 只作用最后 64 维，inverse 也只作用最后 64 维。
```

### Q10. Compression position encoding

- 时间：`2026-05-12T14:04:00.193Z`
- HTML 覆盖位置：HTML §4.1-4.3

**User**

```text
这里的Indexer做128维的位置编码吗？那和主逻辑里面的64维rope不是对不上吗？

位置编码是在压缩前加入还是压缩后假如？
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T14:04:26.846Z`_

```text
这个问题问得很好，因为这里有两个“128”特别容易撞车：`index_head_dim=128` 和 `compress_ratio=128`，但它们不是一回事。我先把 Indexer 的维度和 RoPE 位置拆开，然后再说压缩前后的位置编码。
```

_timestamp: `2026-05-12T14:06:09.772Z`_

```text
不是，**Indexer 不是做 128 维位置编码**。这里的 `128` 是 Indexer 的 head 向量维度：

```text
index_head_dim = 128
rope_head_dim  = 64
```

所以 Indexer 的每个 head 是：

```text
128 维 = 64 维 no-RoPE 内容部分 + 64 维 RoPE 位置部分
```

主 attention 的每个 head 是：

```text
512 维 = 448 维 no-RoPE 内容部分 + 64 维 RoPE 位置部分
```

也就是说，它们 **RoPE 维度都是 64**，没有对不上。对不上的只是总 head dim：主 attention 用 512 维做最终 attention，Indexer 用 128 维做轻量检索打分。

代码里很明确：

```python
# Indexer
self.head_dim = args.index_head_dim      # 128
self.rope_head_dim = args.rope_head_dim  # 64

q = self.wq_b(qr)
q = q.unflatten(-1, (self.n_local_heads, self.head_dim))
apply_rotary_emb(q[..., -rd:], freqs_cis)
```

位置在 [Indexer](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:380)。

**为什么 Indexer 128 维可以和主逻辑 512 维共存**

因为 Indexer 不参与最终 value 聚合。它只负责：

```text
给 compressed blocks 排名，返回 top-k block id
```

最终真正 attention 读的是主 attention 自己的 512 维 compressed KV。

流程是：

```text
Indexer 的 128 维 Q/K：
只算 score，选 block index

主 Attention 的 512 维 Q/KV：
拿这些 block index 去 sparse_attn 里算真正输出
```

所以 Indexer 和主 attention 不需要在同一个向量空间里完全对齐。它们只需要共享同一套“时间位置坐标”，也就是同样的 block id 和同样 64 维 RoPE 相对位置机制。

**位置编码是在压缩前还是压缩后加？**

要分两种“位置”：

```text
1. chunk 内部 learned APE：压缩前/压缩时加入
2. 全局 RoPE：压缩后加入
```

Compressor 里先做：

```python
kv = self.wkv(x)
score = self.wgate(x)
score = score + self.ape
kv_compressed = (kv * score.softmax(dim=2)).sum(dim=2)
```

这里的 `ape` 是 learned positional bias，用来告诉压缩器：在一个 4-token 或 128-token chunk 内，第几个 token 该怎么参与压缩。这个是压缩时加入的。

然后才做：

```python
kv = self.norm(kv)
apply_rotary_emb(kv[..., -rd:], freqs_cis)
```

也就是 **RoPE 是压缩之后加到 compressed KV 上的**。

代码位置在 [Compressor.forward](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:323)。

**为什么 RoPE 不在压缩前加？**

如果你先给每个 token 加 RoPE，再把它们加权平均：

```text
Σ α_t · R_t kv_t
```

这个 compressed vector 会混着多个绝对位置的旋转。它不像一个干净的“这个 block 的 key”，而是一锅不同坐标系的向量。

DSV4 代码选择的是：

```text
先在未 RoPE 的空间里压出 block summary
再给这个 summary 分配一个代表位置
再加 RoPE
```

公式是：

```text
c_k = Σ_{t in block k} α_t · kv_t

c'_k = R_{pos(k)} c_k
```

这样 compressed block 在 attention 里就像一个普通 key/value，只不过它代表一段 token。

**compressed block 用哪个位置加 RoPE？**

代码里 prefill 时：

```python
freqs_cis = self.freqs_cis[:cutoff:ratio]
```

所以 block 位置大致是：

```text
ratio=4:   0, 4, 8, 12, ...
ratio=128: 0, 128, 256, ...
```

decode 时：

```python
freqs_cis = self.freqs_cis[start_pos + 1 - self.compress_ratio]
```

比如 ratio=4：

```text
token 0..3 压成 block，位置用 0
token 4..7 压成 block，位置用 4
token 8..11 压成 block，位置用 8
```

所以 compressed KV 的 RoPE 位置是这个 chunk 的起点位置。

**ratio=4 overlap 下也一样吗？**

是的。ratio=4 的 block 内容会有 overlap，可能混入上一组 token 的一半表示，但它的 RoPE 仍然用当前 chunk 的代表位置：

```text
compressed block k 内容：
上一 chunk 的一部分 + 当前 chunk 的一部分

RoPE 位置：
k * 4
```

这说明 ratio=4 的 compressed KV 不是精确 token-level 位置编码，而是：

```text
局部相对位置靠 learned APE/gating 吸收；
全局长程位置靠 block-level RoPE 表示。
```

**最终一句话**

Indexer 的 128 维不是 128 维 RoPE，而是 **128 维检索向量，其中最后 64 维做 RoPE**。主 attention 是 **512 维向量，其中最后 64 维做 RoPE**。压缩路径里，chunk 内部位置用 learned `ape` 在压缩时处理；全局 RoPE 在压缩成 block 之后加到 compressed KV 上。
```

### Q11. attn_sink / Gated Attention

- 时间：`2026-05-12T14:07:24.055Z`
- HTML 覆盖位置：HTML §6

**User**

```text
对啊，但是这里的attn_sink不是contexture的，而是per head的。而 Gated Attention也是如此。你能从数学上对比、或者近似对比两者作用的异同吗？
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T14:08:15.131Z`_

```text
对，`attn_sink` 参数本身确实不是 contextual 的。它只是每个 head 一个标量：

```text
a_h
```

但它的**实际缩放效果**是 contextual 的，因为它和当前 query 对候选 KV 的全部 logits 一起进入 softmax 分母。

设某个 token、某个 head 的 sparse attention logits 是：

```text
s_i = q^T k_i / sqrt(d), i ∈ I
Z = Σ_i exp(s_i)
A = Σ_i exp(s_i) / Z · v_i
```

普通 attention 输出是：

```text
A
```

带 sink 后：

```text
A_sink = Σ_i exp(s_i) / (Z + exp(a_h)) · v_i
```

等价改写为：

```text
A_sink = λ · A

λ = Z / (Z + exp(a_h))
  = sigmoid(logsumexp_i(s_i) - a_h)
```

所以虽然 `a_h` 是 per-head 常量，**λ 不是常量**。它取决于当前候选 KV 的整体匹配强度 `logsumexp(s_i)`。

和 Gated Attention 对比，假设 gate 是 per-head 标量：

```text
A_gate = g_h · A
```

如果 `g_h` 真的是静态 per-head 参数，那它只能学：

```text
这个 head 总体该放大/压小
```

而 sink 学的是：

```text
这个 head 需要多强的证据，才把当前候选 KV 当真
```

更一般的 contextual gate 是：

```text
A_gate = g_h(x) · A
```

它能随 token/context 变化。但常见 gate 多半从 `x` 或 `q` 来：

```text
g_h = sigmoid(w_h^T x + b_h)
```

它知道“当前 token 想不想用这个 head”，但不天然知道“Indexer 这次挑来的 KV 靠不靠谱”。

`sink` 的缩放项是：

```text
λ = sigmoid(logsumexp(qK^T) - a_h)
```

它直接看到了 `q` 和被选中 `K` 的匹配结果。

所以近似关系是：

```text
attn_sink ≈ 一个 score-aware 的 post-attention scalar gate
```

但这个 gate 的输入不是 hidden state，而是 attention logits 的 `logsumexp`。

还有一个数学差异很关键：普通 softmax attention 对 logits 平移不敏感：

```text
softmax(s_i + c) = softmax(s_i)
```

所以如果所有候选 KV 都“同样差”或“同样弱”，普通 attention 仍然会强制归一化出一个满强度输出。

sink 打破了这个平移不变性：

```text
λ(s+c) = sigmoid(logsumexp(s) + c - a_h)
```

也就是说，它把 logits 的**绝对证据强度**变成了输出幅度。Gated Attention 如果不显式读取 attention logits，就没有这个性质。

最终可以这样对比：

```text
Gated Attention:
控制“这个 head 的结果要不要进入主干”
通常是 query/context aware

attn_sink:
控制“这批候选 KV 是否值得被 softmax 强行分配概率”
是 evidence aware，证据来自 qK logits
```

如果你设计一个 gate：

```text
g_h = sigmoid(logsumexp(qK^T) - b_h)
```

那它和 `attn_sink` 在输出缩放上几乎等价。但 DSV4 的 `attn_sink` 用非常便宜的方式把这个 gate 塞进了 softmax 本身。它不是比 Gated Attention 表达力更强，而是归纳偏置更贴 sparse retrieval attention 的痛点。
```

### Q12. RoPE / inverse RoPE / RoPER

- 时间：`2026-05-12T14:17:31.492Z`
- HTML 覆盖位置：HTML §5

**User**

```text
所以K和V前(512-64)是共享的？这里其实是K做了Rope之后再存KV Cache对吧。其实本质上V就是把kv后64维做inverse Rope之后，再当作v用。所以其实把kv cache dim从512+64降到了512。那么为什么不直接存一个v呢？需要做K的时候，就把后64维rope化就好了。以及这里的inverse Rope具体怎么做的呢？
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T14:17:54.710Z`_

```text
我会把这个说成两个层次：代码实际怎么做，以及它为什么不是“直接存 unrotated V”那么简单。这里最关键的一点是：inverse RoPE 后得到的不是普通未旋转 `v_j`，而是相对当前位置旋转过的 value。
```

_timestamp: `2026-05-12T14:19:52.542Z`_

```text
对，可以这么理解，但要补一个关键修正：

**cache 里存的是 K-ready 的 latent KV，不是普通 V。inverse RoPE 后得到的也不是原始未旋转 `v_j`，而是“相对当前位置”的 value。**

代码路径在 [inference/model.py](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:502)：

```python
kv = self.wkv(x)                 # [B, S, 512]
kv = self.kv_norm(kv)
apply_rotary_emb(kv[..., -rd:], freqs_cis)  # rd = 64

o = sparse_attn(q, kv, ...)
apply_rotary_emb(o[..., -rd:], freqs_cis, True)
```

**1. K 和 V 的前 448 维是不是共享？**

是的，按这个实现，`512 = 448 + 64`：

```text
kv_j = [c_j, p_j]

c_j ∈ R^448   不做 RoPE
p_j ∈ R^64    做 RoPE
```

cache 里实际存的是：

```text
cached_j = [c_j, R_j p_j]
```

`sparse_attn` 里同一个 `cached_j` 同时用于：

```text
score: q_i · cached_j
value: 加权求和 cached_j
```

所以这里没有显式的 `K cache` 和 `V cache` 两份，也没有 `kv -> k/v` 的小矩阵。`sparse_attn` 签名就是：

```python
sparse_attn(q, kv, attn_sink, topk_idxs, softmax_scale)
```

不是 `sparse_attn(q, k, v, ...)`。

**2. inverse RoPE 后是不是等价于把后 64 维当 V？**

要小心。不是：

```text
V_j = R_j^{-1}(R_j p_j) = p_j
```

因为代码不是对每个 cached KV 按它自己的位置 `j` inverse，而是 attention 加权求和以后，按当前 query 位置 `i` inverse。

只看后 64 维：

```text
q'_i  = R_i q_i
kv'_j = R_j p_j
```

score 是：

```text
s_ij = (R_i q_i)^T (R_j p_j)
     = q_i^T R_i^T R_j p_j
     = q_i^T R_{j-i} p_j
```

attention 输出先得到：

```text
o'_i = Σ_j α_ij · R_j p_j
```

然后 inverse 当前 query 位置：

```text
o_i = R_i^{-1} o'_i
    = Σ_j α_ij · R_i^{-1} R_j p_j
    = Σ_j α_ij · R_{j-i} p_j
```

所以 effective value 是：

```text
V_eff(i, j) = R_{j-i} p_j
```

它依赖当前 query 位置 `i`。这不是普通的、query-independent 的 `V_j = p_j`。

人话说：**DSV4 没有把 RoPE value 完全还原成无位置 value，而是把绝对位置旋转变成了相对位置旋转。**

**3. 那为什么不直接存一个 unrotated V？**

有几种方案：

```text
方案 A：当前实现
存 [c_j, R_j p_j]，维度 512。
score 可直接用；value 聚合后只需对输出做一次 R_i^{-1}。
```

```text
方案 B：只存 unrotated [c_j, p_j]，维度也是 512。
score 时必须对每个被 gather 的 p_j 临时做 R_j p_j。
如果还想保持当前数学效果，value 也要用 R_j p_j 聚合，再 inverse。
这没有省 cache，只是把 RoPE 计算挪进 sparse kernel，变慢也更复杂。
```

```text
方案 C：同时存 K-ready 和 V-ready。
存 [c_j, R_j p_j, p_j]，大约 448 + 64 + 64 = 576。
score 方便，普通 V 也方便，但 KV cache 多 64 维，而且数学变成普通 V，不是当前训练出来的行为。
```

所以当前做法的妙处是：

```text
只存 512 维；
K 可以直接点积；
V 的后 64 维通过“先用 rotated value 聚合，再对输出 inverse”得到相对位置 value；
不用在 sparse attention 内部对每个 selected KV 动态 RoPE。
```

这利用了线性性：

```text
R_i^{-1} Σ_j α_j R_j p_j
```

可以先求和，再统一 inverse。比对每个 pair 做 `R_{j-i}` 便宜得多。

**4. inverse RoPE 具体怎么做**

代码在 [apply_rotary_emb](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:232)。

它把最后 64 维每两维看成一个复数：

```text
(x_0, x_1) -> z_0 = x_0 + i x_1
(x_2, x_3) -> z_1 = x_2 + i x_3
...
```

普通 RoPE：

```text
z_m <- z_m · exp(i θ_{pos,m})
```

inverse RoPE：

```text
z_m <- z_m · conj(exp(i θ_{pos,m}))
     = z_m · exp(-i θ_{pos,m})
```

代码里就是：

```python
if inverse:
    freqs_cis = freqs_cis.conj()
x = torch.view_as_real(x * freqs_cis).flatten(-2)
```

对 attention 输出时，`pos` 是当前 query token 的位置 `i`。所以它把输出后 64 维旋回当前 token 的坐标系。

最终可以总结成一句：

```text
DSV4 不是“存 K，再另存 V”；
它存一个 K/V 共享 latent，其中 RoPE 部分先按历史位置旋转。
attention 后用当前 query 位置 inverse，使 value 的 RoPE 部分变成相对位置表示。
```

这就是为什么它能把本来可能需要 `448 + 64(K-rope) + 64(V-rope)` 的 cache 压成 `512`，同时还保留相对位置信息。
```

### Q13. Compression position encoding

- 时间：`2026-05-12T14:24:57.177Z`
- HTML 覆盖位置：HTML §4.1-4.3

**User**

```text
self.ape的size是什么样？

排除前128个Token，这里的Position Index为什么要这样？

ratio=4:   0, 4, 8, 12, ...
ratio=128: 0, 128, 256, ...

不能直接1、2、3、4这种吗？

为什么？

从数学原理和算法Insight上分析一下。

本质上我记录了可变化的相对位置就够了啊
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T14:26:04.104Z`_

```text
`self.ape` 在 Compressor 里：

```python
coff = 1 + self.overlap
self.ape = nn.Parameter(torch.empty(compress_ratio, coff * self.head_dim))
```

所以 shape 是：

```text
ratio=128, 主 Attention compressor:
ape: [128, 512]

ratio=4, 主 Attention compressor, overlap=True:
ape: [4, 1024]

ratio=4, Indexer compressor, head_dim=128, overlap=True:
ape: [4, 256]
```

它不是全局 position embedding，而是 **chunk 内部的位置偏置**。比如 ratio=4 时，`ape[0]..ape[3]` 只表示“这个 token 是 4-token 小块里的第几个”。

**先区分两个 index**

这里容易混：

```text
1. cache/storage index
2. RoPE position index
```

`offset=128` 或 `offset=seqlen` 是 storage index，因为 KV cache 前面放 sliding window raw KV，后面放 compressed KV。

但 RoPE 用的位置不是这个 storage index。compressed KV 的 RoPE 位置在代码里是：

```python
freqs_cis = self.freqs_cis[:cutoff:ratio]
```

所以是：

```text
ratio=4   : 0, 4, 8, 12, ...
ratio=128 : 0, 128, 256, ...
```

decode 时也是：

```python
freqs_cis = self.freqs_cis[start_pos + 1 - self.compress_ratio]
```

也就是一个 chunk 压完后，用 chunk 起点做代表位置。

**为什么不能用 1,2,3,4**

因为 RoPE 里的 position index 不是“第几个 compressed block”，而是“原 token 时间轴上的位置”。

RoPE 的相对位置性质来自：

```text
(R_i q)^T (R_j k) = q^T R_{j-i} k
```

也就是说，attention score 看到的是：

```text
j - i
```

如果 compressed block 用原始 token 坐标：

```text
block 0 -> pos 0
block 1 -> pos 4
block 2 -> pos 8
```

当前 token 在 `i=1000` 时，block 0 的相对距离就是：

```text
0 - 1000 = -1000
```

这基本符合真实 token 距离。

但如果你用 compressed 序号：

```text
block 0 -> pos 0
block 1 -> pos 1
block 2 -> pos 2
```

那 ratio=4 时，block 1 会被看成只比 block 0 远 1 个 token；但它真实起点差了 4 个 token。

更严重的是 ratio=128：

```text
block 1 真实位置差 128 tokens
但你给 RoPE pos=1
```

那模型会以为这个压缩块“离我很近”。长上下文的相对距离尺度直接乱掉。

**数学上会发生什么**

设第 `m` 个 compressed block 代表原 token 区间：

```text
[mr, mr+r-1]
```

其中 `r` 是 ratio。

现在 query 在原始位置 `i`。

如果用正确位置：

```text
p_m = mr
score ≈ q_i^T R_{mr-i} c_m
```

如果用压缩序号：

```text
p_m = m
score ≈ q_i^T R_{m-i} c_m
```

这相当于把远处距离压缩了 `r` 倍。ratio=128 时尤其离谱：

```text
真实距离 128000 tokens
RoPE 以为是 1000 tokens
```

这不是“只记录相对位置就够了”的问题，而是你记录的相对位置单位变了。

**那本质上只记录可变化的相对位置不够吗**

如果所有层、所有 KV 都在同一个压缩尺度里，理论上可以设计一种“compressed RoPE”，让 block 序号 `m` 表示 compressed time。可是 DSV4 的 attention 里同时混了两类东西：

```text
最近 128 个 raw token：位置单位是 1 token
远处 compressed block：ratio=4 或 ratio=128
```

它们最后被放进同一个 sparse softmax 里比较。为了让 raw KV 和 compressed KV 的位置尺度一致，compressed block 必须回到原 token 坐标系。

否则同一个 query 会同时看到：

```text
raw token pos = 999, 1000, 1001
compressed block pos = 1, 2, 3
```

这些位置就不在同一把尺子上了。

**为什么用 chunk 起点，而不是中心点**

用起点：

```text
0, 4, 8...
0, 128, 256...
```

是一种简单、可增量 decode 的代表位置。decode 时一旦凑满一个 chunk，就知道它的起点：

```text
start_pos + 1 - ratio
```

中心点也可以想象，比如 ratio=128 用 `64,192,320...`，但这会引入半块偏移，而且和 causal 边界、增量写 cache 处理更麻烦。DSV4 选择起点，再用 `ape` 和 learned gating 去吸收 chunk 内部局部位置差异。

所以整体 insight 是：

```text
ape 管 chunk 内部“第几个 token 更重要”；
RoPE 管 chunk 在原始长序列里的全局位置；
compressed block 的 RoPE index 必须仍然使用原 token 坐标，而不是 compressed 序号。
```

这保证 raw window 和 compressed memory 进入同一个 attention 时，距离含义是一致的。
```

### Q14. attn_sink / Gated Attention

- 时间：`2026-05-12T14:28:05.330Z`
- HTML 覆盖位置：HTML §6

**User**

```text
Gated Attention本质上用在用g_h(x)来模拟logsumexp_i(s_i)？可以这样理解吗？从数学上
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T14:28:33.224Z`_

```text
可以这样理解一部分，但要加一个限定：

**如果 Gated Attention 的目标是替代 `attn_sink` 的“置信度缩放”，那它确实是在试图用 `g_h(x)` 近似一个和 `logsumexp_i(s_i)` 有关的量。**

先看 `attn_sink` 的等价形式。对某个 head：

```text
A = Σ_i softmax(s)_i v_i
s_i = q^T k_i / sqrt(d)
L = logsumexp_i(s_i)
```

带 sink 后：

```text
A_sink = λ A
λ = exp(L) / (exp(L) + exp(a_h))
  = sigmoid(L - a_h)
```

所以 `attn_sink` 的缩放因子就是：

```text
λ_sink(q, K_I) = sigmoid(logsumexp_i(q^T k_i / sqrt(d)) - a_h)
```

它看的是当前 query 和候选 KV 集合的总体证据强度。

如果 Gated Attention 写成：

```text
A_gate = g_h(x) A
g_h(x) = sigmoid(w_h^T x + b_h)
```

那它要模拟 sink 的效果，就等价于希望：

```text
w_h^T x + b_h ≈ logsumexp_i(q(x)^T k_i / sqrt(d)) - a_h
```

也就是你说的：**用 `g_h(x)` 间接模拟 `logsumexp_i(s_i)`。**

但这里有个核心差异：

```text
logsumexp_i(s_i)
```

不仅依赖当前 token 的 `x/q`，还依赖被选中的 `K_I`：

```text
L = L(q(x), K_I(context, indexer))
```

而普通 `g_h(x)` 只看当前 token。除非 `x` 已经高度编码了“我这次会从缓存里检索到什么、匹配强不强”，否则它很难精确知道这个 `L`。

所以数学上关系可以写成：

```text
最佳 gate:
g*_h(x, K_I) = sigmoid(logsumexp_i(s_i) - a_h)

普通 Gated Attention:
g_h(x) ≈ E[ g*_h(x, K_I) | x ]
```

也就是它最多学到一个条件期望：在看到当前 `x` 的情况下，平均来说这个 head 应该开多大。它不能精确响应“这次 top-k 选得好不好”。

如果 gate 允许看 attention logits，比如：

```text
g_h = sigmoid(α logsumexp_i(s_i) + β)
```

那它和 `attn_sink` 就几乎同构。取：

```text
α = 1
β = -a_h
```

就是 sink 的缩放因子。

更进一步，`attn_sink` 其实可以看成一个特殊 Gated Attention：

```text
A_sink = sigmoid(logsumexp(s) - a_h) · A
```

特殊之处是：

```text
gate 的输入不是 x，而是 attention logits 的 log-partition function。
```

这也是它比普通 `g_h(x)` 更贴 sparse attention 的原因：它直接读取“候选 KV 集合有没有足够强的匹配证据”。
```

### Q15. RoPE/RoPER + compressed anchors

- 时间：`2026-05-12T15:10:46.392Z`
- HTML 覆盖位置：HTML §5, §4.1-4.3

**User**

```text
V_eff(i, j) = R_{j-i} p_j里面加入相对位置旋转，这个数学表现会怎么样？之前有人干过吗？有没有Paper支撑。直觉上感觉很诡异啊。QK已经相对位置一次了，V还要相对位置一次。长程衰减不是Double的吗？

我们考虑学习的时候的情况，0, 128, 256...，前128的位置都学过，但是类似于129、130这些位置都没有学习过啊，这个有问题吗？

coff = 1 + self.overlap 
self.overlap = 4
coff=5了
head_dim=256，那么不是256*5吗？为什么是1024？
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T15:13:18.941Z`_

```text
对，这里直觉上确实怪，但它不是“QK 相对位置打分一次，V 再衰减一次”。更准确地说：

```text
QK 的 RoPE：决定“该看谁”
V/output 的 inverse RoPE：让“看回来的东西”带着相对距离坐标，同时消掉绝对位置泄漏
```

把 512 维拆成：

```text
kv_j = [u_j, p_j]
u_j ∈ R^448, 不做 RoPE
p_j ∈ R^64, 做 RoPE
```

cache 里存的是：

```text
[u_j, R(t_j) p_j]
```

这里 `t_j` 是 raw token 位置，或者 compressed block 的 anchor 位置。

query 的 rope 部分是：

```text
R(i) q_i
```

所以 score 近似是：

```text
s_ij = q_u^T u_j + q_p^T R(t_j - i) p_j
```

attention 权重：

```text
α_ij = softmax_j(s_ij)
```

输出 rope 部分先是：

```text
o'_i = Σ_j α_ij R(t_j) p_j
```

然后对当前 query 位置 inverse：

```text
o_i = R(-i)o'_i
    = Σ_j α_ij R(t_j - i) p_j
```

所以你写的：

```text
V_eff(i,j) = R(t_j - i) p_j
```

是对的。

**这会 double 长程衰减吗？**

不会是标量意义上的 double decay。RoPE 的 `R(Δ)` 是正交旋转：

```text
||R(Δ)p_j|| = ||p_j||
```

它不直接把远处 value 变小。真正进入 softmax 的“看谁”还是由 score 决定。value 里的相对旋转更多是在输出表示里保留“我拿到的信息来自相对多远的位置”。

当然，它会带来相位差：如果一个 head 同时混很多不同距离的 value，64 维 rope 子空间里可能有相位抵消。但这不是简单距离越远越小，而是“不同相对距离的信息在同一子空间里有不同方向”。这反而给后续 `wo_a/wo_b` 一个信号：同样内容，来自近处还是远处，不完全一样。

这个设计的另一个核心目的，是恢复平移一致性。vLLM 的 DeepSeek V4 解释也给了同样推导：K=V 共享后，输出会直接带 `R(j)` 这种绝对位置；乘 `R(-i)` 后，输出只剩 `R(j-i)`，重新变成相对位置形式。见 [vLLM DeepSeek V4 appendix](https://vllm.ai/blog/deepseek-v4)。

**之前有人干过吗？**

有相近先例，叫 RoPER：Rotary Positional Embeddings with Relative distances。它明确做的是：value 也旋转，weighted sum 后再反向旋转，从而让 value 输出携带相对距离信息。见 [RoPER 说明](https://research.labml.ai/RoPER.html) 和 [labml 实现](https://nn.labml.ai/transformers/rope/value_pe/index.html)。

RoPE 本身的理论基础来自 RoFormer：旋转让 QK 点积依赖相对位置，并具有长距离相关性的某些衰减/相位性质。见 [RoFormer paper](https://huggingface.co/papers/2104.09864)。DSV4 这里不是原版 RoPE 的常规用法，而是 K=V 共享以后，为了省 cache 和保持相对位置一致性做的扩展。HuggingFace 的 DeepSeek-V4 文档也明确写了：共享 K=V，partial RoPE，并在 attention output 的 rope slice 上用 `-i` 位置做 inverse，让每个 KV 贡献保持为 query-relative。见 [HF DeepSeek-V4 docs](https://huggingface.co/docs/transformers/main/model_doc/deepseek_v4)。

**129、130 这些位置没有学习过吗？**

这里要分清：RoPE 不是 learned absolute embedding table。`R(129)`、`R(130)` 是公式算出来的，不存在“表里没学过这个位置”。

但对 `c128a` compressed KV 来说，确实只有这些 anchor：

```text
0, 128, 256, ...
```

第 129、130 个 token 不会各自产生一个 c128 compressed entry。它们属于：

```text
anchor 128 的 block: [128, 255]
```

这个 block 内部谁重要，由 compressor 的 `wgate + ape` 做加权池化。细粒度位置信息不是靠 129/130 的 RoPE anchor 表达，而是靠：

```text
1. 最近 128 raw sliding window 保留精确 token 位置
2. block 内 ape/gating 学局部偏移
3. compressed block 用 anchor 位置表达全局距离
```

vLLM 文档里也写得很直接：`c4a` 的第 `j` 个 compressed token 覆盖 `[4j-4, 4j+3]`，位置用 `4j`；`c128a` 覆盖 `[128j,128j+127]`，位置用 `128j`。见同一篇 [vLLM appendix](https://vllm.ai/blog/deepseek-v4)。

**最后，coff 这里你看错了一点**

代码是：

```python
self.overlap = compress_ratio == 4
coff = 1 + self.overlap
```

`self.overlap` 是 bool，不是 4。Python 里：

```text
False == 0
True  == 1
```

所以 ratio=4 时：

```text
coff = 1 + True = 2
```

不是 5。

因此主 attention compressor：

```text
head_dim = 512
ape shape = [4, 2 * 512] = [4, 1024]
```

如果假设 `head_dim=256`，那就是：

```text
ape shape = [4, 512]
```

Indexer compressor 因为 `head_dim=128`，所以是：

```text
ape shape = [4, 256]
```

对应代码在 [inference/model.py](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:289)。
```

### Q16. Compression position encoding

- 时间：`2026-05-12T15:18:36.694Z`
- HTML 覆盖位置：HTML §4.1-4.3

**User**

```text
我们考虑学习的时候的情况，0, 128, 256...，前128的位置都学过，但是类似于129、130这些位置都没有学习过啊，这个有问题吗？我的意思说这些129、130这些位置在训练的时候没有见过
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T15:19:36.458Z`_

```text
明白了。你不是说 RoPE 公式里有没有 `R(129)`，而是说：

```text
c128 压缩分支的 key anchor 只出现在 0,128,256...
那训练时 compressed KV 好像从来不会以 129、130 作为位置。
这会不会导致模型没学过这些位置？
```

答案是：**对 c128 compressed key 来说，129/130 确实不会作为 anchor position 出现；但这不是 bug，是设计的一部分。它把“块内位置”和“块级全局位置”拆开学。**

c128 的第 `j` 个块是：

```text
block j covers [128j, 128j+127]
anchor position = 128j
```

所以 token 129、130 在：

```text
block 1 covers [128,255]
anchor = 128
local offset:
129 -> offset 1
130 -> offset 2
```

它们不会拥有独立的 global RoPE anchor `129/130`，但它们的块内位置会通过 compressor 的 `ape` 学到。

c128 的 `ape` shape 是：

```text
[128, 512]
```

所以它有：

```text
ape[0], ape[1], ape[2], ..., ape[127]
```

对应一个 128-token chunk 内的第几个 token。也就是说，129/130 不是作为“全局 RoPE 位置 129/130”出现，而是作为：

```text
anchor 128 + local offset 1/2
```

被 compressor 学进去。

更完整地看，c128 compressed KV 是：

```text
c_j = Σ_{r=0}^{127} α_{j,r} · kv_{128j+r}
```

其中：

```text
α_{j,r} = softmax(wgate(x_{128j+r}) + ape[r])
```

然后才加 RoPE：

```text
cached_j = R(128j) c_j
```

所以位置结构是两级的：

```text
块内位置：ape[r] 负责，r=0..127
块级全局位置：RoPE anchor 负责，128j
```

这就是为什么不用 `129/130` 当 compressed anchor。因为 c128 的语义不是“每个 token 一个 key”，而是“每 128 个 token 一个摘要 key”。

但还有一个细节：**模型其实仍然会见到相对距离 129、130。**

query 位置 `i` 是每个 token 都有的，比如 `i=129`、`i=130`。当它看某个 compressed block anchor `t_j=0` 或 `128` 时，RoPE score 里出现的是：

```text
R(t_j - i)
```

比如：

```text
query i=129, block anchor 0   -> R(-129)
query i=130, block anchor 0   -> R(-130)
query i=255, block anchor 128 -> R(-127)
```

所以非 128 倍数的位置并没有从 RoPE 计算里消失；它们作为 query position 和 relative distance 出现。只是 compressed key 的 anchor 被量化到了块起点。

还有最近 128 token 的 sliding window 分支，它保留 raw KV。这里 token 129、130 作为原始 token，是会直接用自己的位置做 RoPE 的：

```text
raw KV at position 129 -> R(129)
raw KV at position 130 -> R(130)
```

所以总结一下：

```text
1. raw sliding window：129、130 会作为真实 token 位置出现。
2. c128 compressed KV：129、130 不作为 anchor 出现，只作为块内 offset 由 ape/gating 表达。
3. query 侧：129、130 会作为 query position 出现。
4. relative RoPE：R(-129)、R(-130) 这类相对距离仍然会出现。
```

这当然有代价：c128 分支放弃了块内精确全局位置，换来 128x cache 压缩。DSV4 用 sliding window + c4a 交错层 + `ape` 来补这个损失。直觉上就是：

```text
近处：精确到 token。
中远处 c4a：较细摘要，stride 4，有 overlap。
远处 c128：粗摘要，stride 128，靠块内 ape 表示局部结构。
```

所以“129/130 没作为 c128 anchor 学过”不是漏洞，而是这个压缩记忆的抽象边界。
```

### Q17. RoPE / inverse RoPE / RoPER

- 时间：`2026-05-12T15:20:29.871Z`
- HTML 覆盖位置：HTML §5

**User**

```text
V_eff(i,j) = R(t_j - i) p_j
能不能进一步分析一下这个数学性质和Insight。
以及RoPER这里面是否有Ablation Study支持这个
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T15:22:15.460Z`_

```text
可以。把 `V_eff(i,j) = R(t_j - i)p_j` 看成一句话：

**attention 权重决定“取多少内容”，value 里的 RoPE 决定“这份内容是从哪个相对距离取来的”。**

DSV4 代码里就是这个模式：[inference/model.py](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:499) 先对 `q` 和 `kv` 的 rope slice 加 RoPE，[inference/model.py](/Users/jyxc-dz-0100301/Documents/code/thirdparty/DeepSeek-V4-Pro/inference/model.py:534) 再对 attention output 做 inverse RoPE。

**数学性质**

只看一个 RoPE 二维 pair，用复数写最清楚：

```text
p_j -> z_j ∈ C
R(t_j - i)p_j -> z_j · exp(i · (t_j - i) · θ)
```

attention 输出这一维就是：

```text
o_i = Σ_j α_ij · z_j · exp(i · Δ_ij · θ)
Δ_ij = t_j - i
```

所以它不是单纯把 value 混起来：

```text
普通 V:      Σ_j α_ij · z_j
RoPER-like: Σ_j α_ij · z_j · phase(相对距离)
```

这有几个重要后果。

第一，**它保留相对平移不变性**。如果整段序列整体平移 `c`：

```text
i -> i+c
t_j -> t_j+c
t_j - i 不变
```

所以输出不变。没有 inverse RoPE 时，输出里是 `R(t_j)p_j`，整体平移后会多一个 `R(c)`，绝对位置泄漏进 hidden state。vLLM 的 DeepSeek V4 appendix 也是这样解释 K=V 共享时为什么必须 inverse RoPE：[vLLM blog](https://vllm.ai/blog/deepseek-v4)。

第二，**它不是标量衰减**。`R(Δ)` 是正交旋转：

```text
||R(Δ)p_j|| = ||p_j||
```

单个远处 token 的 value 不会因为远而变小。所以它不是“QK 衰减一次，V 再衰减一次”。

第三，**它会让不同相对距离在 value 子空间里有不同相位**。如果 attention 很集中，只看一个 token：

```text
o_i ≈ R(Δ)p_j
```

幅度还在，只是方向携带了相对距离。

如果 attention 很散，同时看很多不同距离：

```text
Σ_j α_ij R(Δ_j)p_j
```

高频 RoPE 维度可能互相抵消。这不是简单 long-range decay，而是“多距离混合时，相对位置信号会变得不确定”。这其实挺合理：如果一个 head 同时从很多距离拿东西，输出里的精确距离信息本来就不该很确定。

第四，**这给后面的 `wo_a/wo_b` 留了可读的距离特征**。普通 value 只告诉后面“我拿到了什么内容”；这个形式还告诉后面“内容大概从相对哪里来”。对于 copy、检索、括号匹配、长程引用这类任务，这个信号可能有用。

**会不会 double count 相对位置**

会“用两次相对位置”，但作用点不同：

```text
QK RoPE:
α_ij = softmax(q_i^T R(t_j-i) k_j)
决定看谁。

Value RoPE:
o_i = Σ_j α_ij R(t_j-i) p_j
决定看回来的表示带什么相对距离相位。
```

所以不是同一个东西重复惩罚两次。更像是：

```text
QK: relative position as selection bias
V:  relative position as returned feature
```

DSV4 又只在 64/512 的 partial rope slice 上做这件事，另外 448 维 value 仍是普通内容通道，这也降低了“相位太重”的风险。Hugging Face DeepSeek-V4 文档也明确写了这一点：partial RoPE 只在 trailing rope channels 上，并对 output rope slice 用 `-i` 旋转，让 KV contribution 依赖相对距离：[HF docs](https://huggingface.co/docs/transformers/main/model_doc/deepseek_v4)。

**RoPER 有没有 ablation 支持**

有，但证据强度要诚实说：**有小规模 RoPE vs RoPER 对比，不是 DSV4 级别的大模型 ablation。**

RoPER 的做法和这里非常接近：value 也做 RoPE，加权求和后再反向旋转，使输出 value 携带相对距离。labml 的 RoPER 页面报告了几个对比实验：[RoPER](https://research.labml.ai/RoPER.html)。

他们的结果大意是：

```text
Arithmetic Addition:
RoPER 略好于 RoPE

Substring by Index:
RoPER 明显好于 RoPE

Substring by Prefix:
RoPER loss 略低

小型 language model:
RoPER 和 RoPE 差不多，没有明显伤害
```

所以支持的 insight 是：**把相对距离注入 value，对算法型位置任务有帮助，对普通 LM 至少小规模实验没明显坏处。**

但不能过度外推成：

```text
RoPER 已经证明 DSV4 一定因此变强
```

更准确地说是：

```text
RoPER 给了“V 侧相对位置”这个数学形式的先例和小实验支持；
DSV4 在 K=V 共享的工程约束下，inverse RoPE 还额外承担了消除绝对位置泄漏、保持平移一致性的职责。
```

所以在 DSV4 里，它不是一个纯“加 feature”的装饰，而是 K=V cache 压缩方案能成立的一块数学补丁。
```

### Q18. RoPE / inverse RoPE / RoPER

- 时间：`2026-05-12T15:25:37.139Z`
- HTML 覆盖位置：HTML §5

**User**

```text
其实在v做inverse rope的时候有两个选择，一个是保留相对位置，一个是去除位置啊，再乘以一个R(t_j)，不就是R(t_j-t_j)的单位阵了吗？为什么没有这样选择
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T15:27:43.171Z`_

```text
对，这里确实有两个“理论选择”：

```text
选择 A：保留相对位置
V_eff(i,j) = R(t_j - i) p_j

选择 B：去掉 value 位置
V_eff(i,j) = p_j
```

但关键是：**选择 B 不能像现在这样在 attention 输出后做一次统一 inverse 就完成。**

先小纠正一下符号：如果 cache 里是：

```text
R(t_j) p_j
```

要去掉位置，应该乘：

```text
R(-t_j)
```

这样才是：

```text
R(-t_j) R(t_j) p_j = p_j
```

如果再乘 `R(t_j)`，会变成 `R(2t_j)`。

**为什么不能输出后统一去掉 t_j**

现在 sparse attention 先聚合：

```text
o'_i = Σ_j α_ij R(t_j) p_j
```

当前实现做的是：

```text
R(-i)o'_i
= Σ_j α_ij R(t_j - i)p_j
```

因为 `i` 对当前 query 是固定的，所以 `R(-i)` 可以放在求和外面，便宜。

但如果你想得到：

```text
Σ_j α_ij p_j
```

你需要：

```text
Σ_j α_ij R(-t_j)R(t_j)p_j
```

这里的 `t_j` 每个被选中的 KV 都不一样，不能在求和之后用一个矩阵统一消掉。

数学上假设存在一个统一矩阵 `M`，能对任意两个位置 `a,b` 都满足：

```text
M R(a)p_a + M R(b)p_b = p_a + p_b
```

那就要求：

```text
M R(a) = I
M R(b) = I
```

于是：

```text
R(a) = R(b)
```

一般不成立。所以 **去掉每个 value 自己的位置，必须在 gather 后、累加前逐个 value 做 inverse**，或者额外存一份未旋转 V。

**为什么 DSV4 没选去位置方案**

主要是三个原因。

第一，省 cache 和省 kernel 复杂度。

当前方案只存：

```text
[u_j, R(t_j)p_j]  # 448 + 64 = 512
```

K 可以直接点积，V 可以直接累加，最后对输出做一次 `R(-i)`。

如果你要普通 unrotated V，有两个做法：

```text
做法 1：cache 同时存 K-ready 和 V-ready
[u_j, R(t_j)p_j, p_j] = 448 + 64 + 64 = 576
```

这会增加 KV cache。DSV4 的核心目标之一就是压 KV cache。

```text
做法 2：只存 [u_j, p_j]
score 时临时给每个 selected KV 做 R(t_j)
```

这会把 RoPE 放进 sparse attention 的内循环里。每个 query、每个 top-k KV 都要处理位置旋转，kernel 会复杂很多，也更慢。

第二，保留 `R(t_j-i)` 给输出留下“信息来自哪里”的特征。

普通 V 输出：

```text
Σ_j α_ij p_j
```

只告诉后续层“拿到了什么内容”。

relative V 输出：

```text
Σ_j α_ij R(t_j-i)p_j
```

还告诉后续层“这些内容相对当前 token 大概来自哪里”。

这对长上下文压缩尤其重要。compressed KV 本来就是摘要，如果 value 侧完全去掉位置，模型在输出表示里会少一个“这个摘要距离我多远”的可读信号。QK 当然已经用位置决定了权重，但 softmax 混完以后，很多关于相对距离的信息会被压成一个标量权重分布；V 侧相位能把距离作为特征带回 hidden state。

第三，它不是真的全维度强行加位置。

只有最后 64/512 维参与这个相对 value 旋转：

```text
448 维：普通内容通道
64 维：相对位置通道
```

所以后续层如果不想用 V 里的相对位置，可以主要依赖前 448 维；如果需要相对距离，可以读后 64 维。这是比较温和的设计。

**算法 insight**

可以把当前设计看成：

```text
QK RoPE：用相对距离影响“选谁”
V RoPE + inverse：把相对距离作为“返回内容的一部分”
```

不是为了再惩罚一次远距离，而是为了避免 K=V 共享时输出携带绝对位置 `R(t_j)`，同时顺手把它变成 query-relative 的 `R(t_j-i)`。

相关先例是 RoPER，它就是 value 也旋转、输出再 inverse，让 value 携带相对距离；vLLM 和 HuggingFace 的 DeepSeek-V4 文档也用类似推导解释了这个设计：[vLLM DeepSeek V4](https://vllm.ai/blog/deepseek-v4)、[HF DeepSeek-V4 docs](https://huggingface.co/docs/transformers/main/model_doc/deepseek_v4)、[RoPER](https://research.labml.ai/RoPER.html)。
```

### Q19. RoPE / inverse RoPE / RoPER

- 时间：`2026-05-12T15:29:43.072Z`
- HTML 覆盖位置：HTML §5

**User**

```text
全面解读一下RoPER这个工作，以及相关的Ablation Study
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-12T15:31:30.907Z`_

```text
可以。先给结论：**RoPER 不是一个主流大论文级别、做了完整大模型 ablation 的工作；它更像一个很干净的数学观察 + 小规模实验验证。** 但它和 DSV4 这里的 inverse RoPE 逻辑高度贴近。

资料主要来自 labml 的 RoPER 页面和实现：[RoPER writeup](https://research.labml.ai/RoPER.html)、[labml implementation](https://nn.labml.ai/transformers/rope/value_pe/index.html)。

**RoPER 要解决什么**

普通 RoPE 做的是：

```text
q'_n = R(n) q_n
k'_i = R(i) k_i
score_{n,i} = q'_n · k'_i
            = q_n^T R(i-n) k_i
```

所以 **attention score** 里有相对位置 `i-n`。

但普通 attention 输出是：

```text
o_n = Σ_i α_{n,i} v_i
```

这里 value 本身没有显式位置信息。换句话说：

```text
QK 负责“我该看哪个位置”
V 只负责“我拿回什么内容”
```

RoPER 的想法是：**既然模型 attention 到了某个 token，那输出里不应该只知道“拿到了什么”，也应该知道“这个东西从相对多远拿来的”。**

**RoPER 怎么做**

它对 value 也做 RoPE：

```text
v'_i = R(i) v_i
```

先按 attention 权重聚合：

```text
ô_n = Σ_i α_{n,i} R(i) v_i
```

然后对输出做反向旋转：

```text
o_n = R(-n) ô_n
    = Σ_i α_{n,i} R(-n)R(i)v_i
    = Σ_i α_{n,i} R(i-n)v_i
```

这就是 RoPER 的核心公式：

```text
RoPER output = 加权平均一堆“相对当前位置旋转过的 value”
```

所以它不是把位置从 value 里去掉，而是把 value 的绝对位置 `R(i)` 变成相对位置 `R(i-n)`。

**数学 Insight**

普通 RoPE：

```text
α_{n,i} = f(content, relative_position)
o_n = Σ_i α_{n,i} v_i
```

RoPER：

```text
α_{n,i} = f(content, relative_position)
o_n = Σ_i α_{n,i} R(i-n)v_i
```

区别在于，RoPER 的输出本身也携带相对距离相位。

这有几个性质：

1. 平移一致性好。整段序列整体平移 `c` 后，`(i+c)-(n+c)=i-n` 不变。
2. 单个 value 不会因距离变小，因为 `R(Δ)` 是正交旋转，范数不变。
3. 如果一个 head 同时混很多不同距离，RoPE 子空间可能出现相位干涉。这个干涉不是简单衰减，而是“多距离混合会让位置特征变模糊”。
4. 它把 relative position 从“只影响选择”变成“也成为返回特征的一部分”。

人话版：普通 RoPE 像是在问“我要看谁”；RoPER 还把“我从哪里看来的”写进了拿回来的向量里。

**实现细节**

labml 的实现基本是：

```python
scores = q @ k
attn = softmax(scores)

value = value_rotary_pe(value)
x = einsum(attn, value)
x = reverse_rotary_pe(x)
```

也就是：

```text
V 先按自己的位置旋转
attention 聚合
输出再按 query 位置反向旋转
```

它还允许只对 value 的一部分维度做 RoPER，不一定全维度上。

**Ablation / 实验结果**

严格说，RoPER 的实验是 **RoPE vs RoPER 对照**，不是很完整的 ablation matrix。它主要做了 3 个算法任务 + 1 个小语言模型实验。

算法任务设置：

```text
Arithmetic Addition / Substring by Index:
20M 参数模型
embedding size 512
6 layers
8 heads
post-layernorm
训练序列长度 641
batch size 32
训练 5,000 steps
测试 128 个随机问题

Substring by Prefix/Search:
0.6M 参数模型
embedding size 128
3 layers
4 heads
pre-layernorm
序列长度 513
batch size 16
训练 65,000 steps

每组跑 10 次，去掉最差一次，报告剩下 9 次均值
```

报告结果：

| 任务 | RoPE | RoPER | 解读 |
|---|---:|---:|---|
| Arithmetic Addition | 124.33 | 126.33 | 小幅提升 |
| Substring by Index | 62.00 | 96.11 | 大幅提升 |
| Substring by Prefix | 0.3269 loss | 0.3191 loss | 小幅更好 |

最有说服力的是 `Substring by Index`。这个任务本质是“按位置找子串”，非常依赖“拿回来的内容来自哪个相对位置”。RoPER 大幅更好，符合它的设计动机。

语言模型实验：

```text
200M 参数 transformer
English Wikipedia
SentencePiece vocab 32k
```

结论是 RoPER 和 RoPE loss 类似，至少小规模下没有明显伤害。

**这组 ablation 能说明什么**

能说明：

```text
1. 在位置/检索型算法任务上，value 侧加入相对位置信息可能很有用。
2. 在小型 LM 上，RoPER 不明显破坏语言建模。
3. RoPER 的收益更像是“位置任务收益”，不是通用困惑度大幅提升。
```

不能说明：

```text
1. 大模型一定收益。
2. 长上下文一定收益。
3. value RoPE 比所有其他相对位置方案都强。
4. DSV4 的设计完全由 RoPER 实验支撑。
```

这个要诚实一点：RoPER 的证据规模比较小，没有 DSV4 级别的系统 ablation。

**和 DSV4 的关系**

DSV4 这里更像是 RoPER 的一个工程化变体，而且动机更强。因为 DSV4 的 `kv` 是 K/V 共享 latent：

```text
cache_j = [content_j, R(t_j) rope_part_j]
```

同一个 cache 同时当 key 和 value。于是 value 聚合后自然带着 `R(t_j)`。如果不 inverse，会把绝对位置混进 hidden state。

做 inverse 后：

```text
R(-i) Σ_j α_{i,j} R(t_j)p_j
= Σ_j α_{i,j} R(t_j-i)p_j
```

这刚好变成 RoPER 式相对 value。也就是说，在 DSV4 里它不只是“增强 value 的位置表达”，还是 **K/V 共享 cache 能数学上自洽的一步**。

所以我的判断是：

```text
RoPER 提供了先例和小实验支撑；
DSV4 采用类似形式，更多是因为 K=V 共享、partial RoPE、KV cache 压缩这几个工程目标自然推到了这里。
```
```

### Q20. Report production request

- 时间：`2026-05-13T01:39:09.238Z`
- HTML 覆盖位置：HTML §1-12 + discussion audit

**User**

```text
我希望将我们上述讨论的所有关于DSV4的设计，我每一个问题，你每一条回复，以及相关的背景知识例如mHC,RoPER等等，写成一个技术分析报告放在/Users/jyxc-dz-0100301/Documents/code/pravite/houyi.blogs/docs目录下，HTML格式，可以用独立作为网页打开浏览的那种。必要时你也可以下载Reference到这个目录下（/Users/jyxc-dz-0100301/Documents/code/pravite/houyi.blogs/docs/Reference我已经下载了两篇了，你可以接着下载）。我需要非常深入的探讨DSV4的模型结构设计架构。你要同时结合我们之前的讨论，下载的Reference，这个代码库里面的实现，从工程、算法原理和Insight两个方面认真的、深入的讨论DSV4的结构。并且给出计算量、KV Cache量、随着Sequence length增长的示意图。对于Attention部分，Apple to Apple的对比一下，现在的设计，对比纯MLA，SWA等等常见结构。必要的时候你可以自己写代码。你也可以自己创建subagent。
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-13T01:39:30.838Z`_

```text
我会先只做无修改的勘察：确认目标 `docs` 目录结构、已有 Reference、以及 DSV4 代码库里可引用的实现事实。现在处于 Plan Mode，我不会创建或改文件；先把报告方案、资料来源、章节结构和实现步骤定到足够可交给执行者的程度。
```

_timestamp: `2026-05-13T01:39:43.221Z`_

```text
已有 Reference 里正好有 `DeepSeek_V4.pdf` 和 `mHC Manifold-Constrained Hyper-Connections.pdf`，这能覆盖两个核心来源。下一步我会无修改地抽取它们的目录/关键文本，并检查 Houyi blog 仓库是否对 `docs/` 下的独立 HTML 有既定命名或样式习惯。
```

_timestamp: `2026-05-13T01:41:53.345Z`_

```text
收到：中文深度长文、正文综合分析、单文件自包含 HTML。这个组合很适合写成“论文解读 + 代码走读 + 我们对话中的算法追问”三层结构，附录只做问题索引而不打断主线。
```

_timestamp: `2026-05-13T01:43:13.731Z`_

```text
<proposed_plan>
# DSV4 深度技术分析报告计划

## Summary
创建一个中文深度长文式、单文件自包含的 HTML 报告：

`/Users/jyxc-dz-0100301/Documents/code/pravite/houyi.blogs/docs/dsv4-architecture-deep-dive.html`

报告将综合三类材料：我们前面对话中的问题链、`DeepSeek-V4-Pro` inference 代码实现、已有/补充 Reference 文献。正文以体系化分析为主，不逐字转写对话；末尾附“问题索引”说明每个讨论点被合并到哪些章节。报告可直接用浏览器打开，不依赖 Astro 构建或外部 CDN。

## Key Changes
- 新增单文件 HTML 报告，内联 CSS、目录导航、公式块、代码摘录、SVG 图表和对比表。
- 在 `docs/Reference/` 继续补充必要参考资料，优先保存：
  - RoFormer / RoPE 论文；
  - RoPER 页面或快照；
  - Attention Sink / StreamingLLM 论文；
  - 可选的 DeepSeek MLA / V3 相关论文，用于 MLA apple-to-apple 对比。
- 不改 Astro 站点源码，不改 `DeepSeek-V4-Pro` 仓库源码；只产出 docs 下的报告和必要引用文件。

## Report Structure
- `Executive Overview`：DSV4-Pro 的 61 层 decoder-only MoE、1M context、CSA/HCA/mHC/MoE/FP4+FP8 全局架构图。
- `Code-Grounded Architecture`：从 `Transformer -> Block -> Attention -> Compressor/Indexer -> MoE -> mHC -> Head` 逐层解释，并标注关键配置值。
- `Hybrid Attention Deep Dive`：详解 CSA ratio=4 overlap、HCA ratio=128、Indexer 数学公式、sparse_attn kernel、attn_sink、partial RoPE、inverse RoPE、RoPER 关系。
- `mHC and Residual Topology`：结合 mHC 论文解释 4-lane residual stream、Sinkhorn/Birkhoff polytope、稳定性和代码中的 `hc_pre/hc_post`。
- `Engineering and Complexity`：KV cache、FLOPs、precision、kernel、cache layout，给出随 sequence length 增长的 SVG 曲线。
- `Apple-to-Apple Attention Comparison`：对比 Full MLA、SWA、CSA、HCA、DSV4 hybrid；维度统一到 DSV4 的 head_dim/key-value 设定，说明算力、cache、长程信息质量的取舍。
- `Conversation-Derived Questions Appendix`：按主题列出我们讨论过的问题，例如 attn_sink vs gated attention、RoPER value rotation、compressed position anchor、`self.ape` shape、ratio 交错等，并映射到正文小节。

## Metrics and Figures
- 内联 SVG 图表：
  - 单 token decode attention FLOPs 随 `L` 增长；
  - KV cache element count 随 `L` 增长；
  - DSV4 hybrid vs pure MLA vs SWA vs HCA/CSA 分项曲线；
  - ratio=4 overlap 压缩示意图；
  - Indexer -> top-k -> sparse_attn 数据流图；
  - mHC 4-lane pre/post/comb 示意图。
- 计算口径在报告中明确：
  - 主干层：30 个 CSA ratio=4 层，31 个 HCA ratio=128 层；
  - `window_size=128`，`head_dim=512`，`index_head_dim=128`，`index_topk=1024`；
  - KV cache 先以 element count 对比，再补充 BF16/FP8/FP4 混合精度下的近似 bytes；
  - 将论文中的 1M context “27% FLOPs、10% KV cache”作为校准点，不把自算简化模型伪装成官方精确数值。

## Implementation Plan
- 资料阶段：抽取已有 `DeepSeek_V4.pdf`、`mHC` PDF 的关键章节；下载/保存 RoPE、RoPER、Attention Sink 等补充 Reference；记录引用 URL 和本地路径。
- 代码阶段：用 `config.json`、`inference/model.py`、`inference/kernel.py` 建立事实表，覆盖 compression schedule、Indexer、sparse_attn、mHC、MoE、quantization。
- 写作阶段：先生成报告大纲和核心公式，再填充正文；所有长引用改为摘要/转述，避免大段复制。
- 图表阶段：用临时脚本计算数据并生成内联 SVG；不保留额外脚本文件，除非实施时需要可复现脚本并经确认。
- 打包阶段：将 CSS、图表、公式说明、代码摘录、引用清单全部内联到单个 HTML 文件。

## Test Plan
- 直接打开 HTML，确认无外部网络依赖、目录跳转可用、公式/代码块/图表显示正常。
- 用浏览器或 headless Chrome 截图检查桌面宽屏和窄屏布局，不出现文字重叠。
- 校验引用链接、本地 Reference 路径、代码文件路径和关键配置数字。
- 对图表数据做 sanity check：`L=1M` 附近的趋势应与 DSV4 论文图 1 的方向一致。
- 如执行环境允许，运行一次 HTML 静态检查，确保没有未闭合标签、缺失锚点或空图表。

## Assumptions
- 报告语言为中文，术语保留英文缩写，口吻为深入但人话的技术分析。
- 正文综合吸收对话内容，不逐字转写；附录提供问题索引。
- 输出为单文件自包含 HTML，不接入 Astro 内容系统。
- 因目标目录在当前 writable roots 之外，实际写入和下载 Reference 时需要获得文件写入/网络下载授权。
- 当前 `docs/Reference/` 已有的 `DeepSeek_V4.pdf` 和 `mHC Manifold-Constrained Hyper-Connections.pdf` 作为主参考源保留并引用。
</proposed_plan>
```

### Q21. Report production request

- 时间：`2026-05-13T01:43:45.143Z`
- HTML 覆盖位置：HTML §1-12 + discussion audit

**User**

```text
PLEASE IMPLEMENT THIS PLAN:
# DSV4 深度技术分析报告计划

## Summary
创建一个中文深度长文式、单文件自包含的 HTML 报告：

`/Users/jyxc-dz-0100301/Documents/code/pravite/houyi.blogs/docs/dsv4-architecture-deep-dive.html`

报告将综合三类材料：我们前面对话中的问题链、`DeepSeek-V4-Pro` inference 代码实现、已有/补充 Reference 文献。正文以体系化分析为主，不逐字转写对话；末尾附“问题索引”说明每个讨论点被合并到哪些章节。报告可直接用浏览器打开，不依赖 Astro 构建或外部 CDN。

## Key Changes
- 新增单文件 HTML 报告，内联 CSS、目录导航、公式块、代码摘录、SVG 图表和对比表。
- 在 `docs/Reference/` 继续补充必要参考资料，优先保存：
  - RoFormer / RoPE 论文；
  - RoPER 页面或快照；
  - Attention Sink / StreamingLLM 论文；
  - 可选的 DeepSeek MLA / V3 相关论文，用于 MLA apple-to-apple 对比。
- 不改 Astro 站点源码，不改 `DeepSeek-V4-Pro` 仓库源码；只产出 docs 下的报告和必要引用文件。

## Report Structure
- `Executive Overview`：DSV4-Pro 的 61 层 decoder-only MoE、1M context、CSA/HCA/mHC/MoE/FP4+FP8 全局架构图。
- `Code-Grounded Architecture`：从 `Transformer -> Block -> Attention -> Compressor/Indexer -> MoE -> mHC -> Head` 逐层解释，并标注关键配置值。
- `Hybrid Attention Deep Dive`：详解 CSA ratio=4 overlap、HCA ratio=128、Indexer 数学公式、sparse_attn kernel、attn_sink、partial RoPE、inverse RoPE、RoPER 关系。
- `mHC and Residual Topology`：结合 mHC 论文解释 4-lane residual stream、Sinkhorn/Birkhoff polytope、稳定性和代码中的 `hc_pre/hc_post`。
- `Engineering and Complexity`：KV cache、FLOPs、precision、kernel、cache layout，给出随 sequence length 增长的 SVG 曲线。
- `Apple-to-Apple Attention Comparison`：对比 Full MLA、SWA、CSA、HCA、DSV4 hybrid；维度统一到 DSV4 的 head_dim/key-value 设定，说明算力、cache、长程信息质量的取舍。
- `Conversation-Derived Questions Appendix`：按主题列出我们讨论过的问题，例如 attn_sink vs gated attention、RoPER value rotation、compressed position anchor、`self.ape` shape、ratio 交错等，并映射到正文小节。

## Metrics and Figures
- 内联 SVG 图表：
  - 单 token decode attention FLOPs 随 `L` 增长；
  - KV cache element count 随 `L` 增长；
  - DSV4 hybrid vs pure MLA vs SWA vs HCA/CSA 分项曲线；
  - ratio=4 overlap 压缩示意图；
  - Indexer -> top-k -> sparse_attn 数据流图；
  - mHC 4-lane pre/post/comb 示意图。
- 计算口径在报告中明确：
  - 主干层：30 个 CSA ratio=4 层，31 个 HCA ratio=128 层；
  - `window_size=128`，`head_dim=512`，`index_head_dim=128`，`index_topk=1024`；
  - KV cache 先以 element count 对比，再补充 BF16/FP8/FP4 混合精度下的近似 bytes；
  - 将论文中的 1M context “27% FLOPs、10% KV cache”作为校准点，不把自算简化模型伪装成官方精确数值。

## Implementation Plan
- 资料阶段：抽取已有 `DeepSeek_V4.pdf`、`mHC` PDF 的关键章节；下载/保存 RoPE、RoPER、Attention Sink 等补充 Reference；记录引用 URL 和本地路径。
- 代码阶段：用 `config.json`、`inference/model.py`、`inference/kernel.py` 建立事实表，覆盖 compression schedule、Indexer、sparse_attn、mHC、MoE、quantization。
- 写作阶段：先生成报告大纲和核心公式，再填充正文；所有长引用改为摘要/转述，避免大段复制。
- 图表阶段：用临时脚本计算数据并生成内联 SVG；不保留额外脚本文件，除非实施时需要可复现脚本并经确认。
- 打包阶段：将 CSS、图表、公式说明、代码摘录、引用清单全部内联到单个 HTML 文件。

## Test Plan
- 直接打开 HTML，确认无外部网络依赖、目录跳转可用、公式/代码块/图表显示正常。
- 用浏览器或 headless Chrome 截图检查桌面宽屏和窄屏布局，不出现文字重叠。
- 校验引用链接、本地 Reference 路径、代码文件路径和关键配置数字。
- 对图表数据做 sanity check：`L=1M` 附近的趋势应与 DSV4 论文图 1 的方向一致。
- 如执行环境允许，运行一次 HTML 静态检查，确保没有未闭合标签、缺失锚点或空图表。

## Assumptions
- 报告语言为中文，术语保留英文缩写，口吻为深入但人话的技术分析。
- 正文综合吸收对话内容，不逐字转写；附录提供问题索引。
- 输出为单文件自包含 HTML，不接入 Astro 内容系统。
- 因目标目录在当前 writable roots 之外，实际写入和下载 Reference 时需要获得文件写入/网络下载授权。
- 当前 `docs/Reference/` 已有的 `DeepSeek_V4.pdf` 和 `mHC Manifold-Constrained Hyper-Connections.pdf` 作为主参考源保留并引用。
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-13T01:44:06.313Z`_

```text
我会开始执行这个报告产出。第一步先把引用源补齐和事实表整理清楚；由于目标目录不在当前可写 root 里，真正写入 HTML 和下载 Reference 时我会走一次授权写入。
```

_timestamp: `2026-05-13T01:44:10.495Z`_

```text
我在用 executing-plans skill 执行这份计划；它也提醒说如果平台支持 subagent 会更适合，但这次任务的主要风险在资料准确性和写作一致性，我会先本地串起来。`houyi.blogs` 当前已有未跟踪的 `docs/Reference/` 和 `docs/domain-handoff.md`，我会只新增计划指定的报告和补充引用，避开已有内容。
```

_timestamp: `2026-05-13T01:44:56.738Z`_

```text
我会补充下载几份参考源到临时目录，再复制进 `docs/Reference/`。这些下载用于报告引用，不会改项目源码；写入目标 `docs` 目录需要一次提升权限。
```

_timestamp: `2026-05-13T01:45:45.225Z`_

```text
我现在会生成报告本体。为了让图表可复核，我会让脚本内显式写出 DSV4 的层数、ratio schedule、window/top-k/head_dim 等参数，再由这些参数生成 SVG 和复杂度表；报告正文会把“简化估算”和“论文官方口径”分开写清楚。
```

_timestamp: `2026-05-13T01:50:35.485Z`_

```text
生成脚本第一版有一个 Python 字符串边界错误，报告内容还没有写入目标目录。我会修正临时脚本后重新生成。
```

_timestamp: `2026-05-13T01:52:15.829Z`_

```text
我发现报告里还有一处 SVG 文本因模板转义保留了双花括号，并且我会再补一段“compressed anchor position 为什么是 0/4/8 或 0/128/256，而不是 compressed index 1/2/3”的正文，确保你最后那个问题也在主体中被正面回答。
```

_timestamp: `2026-05-13T01:53:05.032Z`_

```text
报告已经写入目标路径。接下来我会做验收：HTML 解析、引用文件存在性、关键章节/图表数量、以及一次 headless 浏览器截图检查。
```

_timestamp: `2026-05-13T01:53:41.133Z`_

```text
截图验证发现顶部 hero 段落里的 inline code 在深色背景上对比度不够。我会加一条仅作用于 hero 的 CSS 覆盖，再重新写入并复查。
```

_timestamp: `2026-05-13T01:55:13.003Z`_

```text
已完成。报告已经写到：

[docs/dsv4-architecture-deep-dive.html](/Users/jyxc-dz-0100301/Documents/code/pravite/houyi.blogs/docs/dsv4-architecture-deep-dive.html)

我也补充了这些 Reference 到 `docs/Reference/`：
- RoFormer / RoPE
- StreamingLLM / Attention Sink
- RoPER 页面快照
- DeepSeek-V3 技术报告

验证过：
- HTML 能被解析，`11` 个章节、`5` 个内联 SVG 图、`7` 张表。
- 引用的本地 Reference 链接都存在。
- 扫描无 `TODO/TBD/NaN/undefined` 这类残留。
- 用 headless Chrome 打开本地 HTML 并截图检查过首屏布局，没有外部 CDN 依赖。

我没有改 Astro 源码，也没有改 `DeepSeek-V4-Pro` 源码；这次只新增了独立 HTML 报告和补充参考文件。
```

### Q22. Report production request

- 时间：`2026-05-13T02:00:58.675Z`
- HTML 覆盖位置：HTML §1-12 + discussion audit

**User**

```text
# In app browser:
- The user has the in-app browser open.
- Current URL: file:///Users/jyxc-dz-0100301/Documents/code/pravite/houyi.blogs/docs/dsv4-architecture-deep-dive.html

## My request for Codex:
1. 排版风格参考blogs里面
2. 多参考Paper里面的解释、code里面的实现，这些第一性的原始资料
3. 要架构图、流程图、Ablation Study引用Tech Report里面的原始图表，你要把图表解析出来。
4. 8. Engineering and Complexity 这个图看起来不对，你自己在校验一下，纯SWA没有意义，现在都是5:1/7:1这种关系。
5. 很多图画得比较丑
6. 你要自己发现和核对其他的问题，再改一版。
7. 你可以回顾一下我们的讨论（查找这个session的聊天记录，你已经做过一次compression，原始记录你要通过API查，你的context里面只剩下Summary了），先把我们讨论的原始问答，记录下来先写成md，这样哪些覆盖到，哪些没有覆盖，可以用html和md交叉互检。
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-13T02:01:14.650Z`_

```text
我会先做一轮只读核对：看当前报告、博客现有页面风格、DSV4 代码与 Reference 目录，外加浏览器截图状态。现在处于计划模式，我先把可发现的问题摸清楚，再给你一版可执行的改版计划。
```

_timestamp: `2026-05-13T02:01:25.162Z`_

```text
第一轮看下来，`docs/Reference` 里素材已经不少，但报告目前还是独立手写页，和博客 Astro 的正式文章样式还没有对齐。下一步我会把现有博客布局/CSS、当前 HTML 结构、Tech Report 图表位置和代码实现点一起对表。
```

_timestamp: `2026-05-13T02:02:05.654Z`_

```text
浏览器插件这边不能直接读取 `file://...` 页，这是它的安全策略限制；我不会绕它。好消息是这类改版决策可以从源码、HTML、PDF/图片抽取和博客 CSS 里完成，视觉验收计划里再明确用安全可行的方式截图。
```

_timestamp: `2026-05-13T02:02:35.698Z`_

```text
有一个关键事实需要校正进新版：根目录 `config.json` 是 HF 命名，`inference/config.json` 才是 inference dataclass 命名；报告需要同时说明这两套字段映射，避免像 `rope_head_dim`/`qk_rope_head_dim` 这种字段读错。
```

_timestamp: `2026-05-13T02:05:50.574Z`_

```text
<proposed_plan>
# DSV4 报告二次改版计划

## Summary
- 改写现有 `docs/dsv4-architecture-deep-dive.html`，保留“单文件可直接打开”的形式，但排版改成贴近 Houyi Blog 的 `PostLayout/global.css`：浅色研究笔记风格、980px 正文、260px sticky TOC、少卡片、少装饰。
- 新增 `docs/dsv4-architecture-discussion-record.md`，从本地 Codex session JSONL 还原我们关于 DSV4 的原始问答链，并建立“问题 → HTML 章节”覆盖矩阵。
- HTML 正文重新以第一性资料为主：DeepSeek-V4 Tech Report、mHC 论文、RoPER 页面、DeepSeek-V3 MLA、`inference/model.py`、`inference/kernel.py`，减少泛泛推断。

## Key Changes
- 图表重做：
  - 从 `DeepSeek_V4.pdf` 原始抽取并嵌入 Figure 1、Figure 2、Figure 3、Figure 4、Figure 6，使用 base64 内嵌，保留单文件属性。
  - 补充 mHC 论文的核心 ablation/稳定性图表引用；RoPER ablation 以原始表格数据重建为表。
  - 自绘图全部重画成更干净的工程图：CSA overlap、Indexer/top-k/sparse_attn、KV cache layout、mHC 4-lane、RoPE/inverse RoPE 数据流。
- `Engineering and Complexity` 重算：
  - 删除“纯 SWA-128 only”作为主对比。
  - 改成 Full MLA、local-global SWA 5:1、local-global SWA 7:1、CSA-only、HCA-only、DSV4 hybrid。
  - 分开画三类曲线：live KV cache、core attention selected entries、Indexer scan cost。
  - 明确说明自算曲线只解释 attention 子模块趋势；官方 1M context 的 `27% FLOPs / 10% KV cache` 仍以 Tech Report Figure 1 为校准点。
- 事实校正与加深：
  - 说明 `config.json` 是 HF 命名，`inference/config.json` 是 inference dataclass 命名，避免 `qk_rope_head_dim`/`rope_head_dim` 混读。
  - 明确 `self.overlap = compress_ratio == 4` 是 bool，所以 ratio=4 时 `coff=2`，不是 5。
  - 精确写出 `self.ape`：ratio=4 主 compressor `[4,1024]`，Indexer compressor `[4,256]`，ratio=128 主 compressor `[128,512]`。
  - 位置编码章节区分：APE 是压缩权重的块内位置偏置；RoPE 是压缩后 KV anchor 的绝对位置旋转。
  - `sparse_attn` 明确不是只服务 ratio=4；它服务 window-only、CSA、HCA，区别只在 `topk_idxs` 来源。
  - DSV4 技术报告若没有 CSA/HCA 消融表，不伪造 ablation；正文明确区分“Tech Report 原始性能/结构图”和“mHC/RoPER 消融证据”。

## Implementation Steps
- 先生成 `dsv4-architecture-discussion-record.md`：
  - 数据源使用本地 session JSONL：`~/.codex/sessions/2026/05/11/rollout-2026-05-11T18-36-22-019e169b-ffc1-7d01-af44-f0e514cba8e0.jsonl`。
  - 记录每个用户问题、对应助手回复、时间戳、主题标签、当前 HTML 覆盖章节。
  - 对被 compression 摘要替代或不完整的段落标注“日志可见内容为准”。
- 改写 HTML：
  - 复制博客文章样式的关键变量和布局，不引入 Astro 构建，不改 `src/`。
  - 将章节重排为：Overview、Paper Figures、Code-Grounded Architecture、Hybrid Attention、RoPE/RoPER、attn_sink vs Gated、mHC、MoE/Output Projection、Engineering Complexity、Apple-to-Apple、Q&A Coverage、References。
  - 所有关键论断加脚注式 source badge：`Paper-Fig3`、`Code-Compressor`、`Code-Kernel`、`mHC-Abla`、`RoPER-Abla`。
- 图表抽取：
  - 用 `pdftoppm/pdftotext` 在临时目录渲染/定位 PDF 页，再裁剪 Figure 1/2/3/4/6。
  - 裁剪图不单独作为依赖文件，转 base64 嵌入 HTML。
  - 对每张原图写“图里说了什么、它不能证明什么、和代码如何对应”。
- 复杂度脚本：
  - 临时脚本显式写入 DSV4 参数：61 层、30 CSA、31 HCA、`window=128`、`head_dim=512`、`index_head_dim=128`、`index_topk=1024`。
  - 输出内联 SVG 和表格；脚本不保留到仓库，除非需要复现则另行放入 `docs/`。

## Test Plan
- 静态检查：
  - HTML parse 成功。
  - 所有 `href="#..."` anchor 存在。
  - 所有 `Reference/...` 本地链接存在。
  - 无 `TODO/TBD/undefined/NaN`。
- 内容核验：
  - 用 `rg/jq` 校验配置数字、ratio count、`self.overlap`、`self.ape`、`attn_sink`、`sparse_attn`、`hc_split_sinkhorn` 等代码事实。
  - 检查 MD 覆盖矩阵里每个历史问题都有 HTML 章节映射。
  - 对 `L=1M` 的自算表做 sanity check，并与 Tech Report Figure 1 的方向一致但不冒充官方精确 FLOPs。
- 视觉验收：
  - 用可行的 headless Chrome 或静态截图路径检查 1440px 与移动窄屏。
  - 重点看目录、长公式、表格、base64 原始图、SVG 图是否溢出或重叠。
  - 若 in-app browser 仍因 `file://` 策略拒绝，最终说明该项由 headless/静态检查替代。

## Assumptions
- 继续保持目标 HTML 为单文件自包含，不接入 Astro 内容系统。
- `docs/Reference/` 已有资料继续复用，不重复下载同名论文。
- 新增 MD 是报告的审计材料，不替代 HTML 正文。
- DSV4 Tech Report 的原始图可引用和解析，但大段文字仍以转述为主，避免长篇复制。
</proposed_plan>
```

### Q23. Report production request

- 时间：`2026-05-13T02:31:25.481Z`
- HTML 覆盖位置：HTML §1-12 + discussion audit

**User**

```text
# In app browser:
- The user has the in-app browser open.
- Current URL: file:///Users/jyxc-dz-0100301/Documents/code/pravite/houyi.blogs/docs/dsv4-architecture-deep-dive.html

## My request for Codex:
PLEASE IMPLEMENT THIS PLAN:
# DSV4 报告二次改版计划

## Summary
- 改写现有 `docs/dsv4-architecture-deep-dive.html`，保留“单文件可直接打开”的形式，但排版改成贴近 Houyi Blog 的 `PostLayout/global.css`：浅色研究笔记风格、980px 正文、260px sticky TOC、少卡片、少装饰。
- 新增 `docs/dsv4-architecture-discussion-record.md`，从本地 Codex session JSONL 还原我们关于 DSV4 的原始问答链，并建立“问题 → HTML 章节”覆盖矩阵。
- HTML 正文重新以第一性资料为主：DeepSeek-V4 Tech Report、mHC 论文、RoPER 页面、DeepSeek-V3 MLA、`inference/model.py`、`inference/kernel.py`，减少泛泛推断。

## Key Changes
- 图表重做：
  - 从 `DeepSeek_V4.pdf` 原始抽取并嵌入 Figure 1、Figure 2、Figure 3、Figure 4、Figure 6，使用 base64 内嵌，保留单文件属性。
  - 补充 mHC 论文的核心 ablation/稳定性图表引用；RoPER ablation 以原始表格数据重建为表。
  - 自绘图全部重画成更干净的工程图：CSA overlap、Indexer/top-k/sparse_attn、KV cache layout、mHC 4-lane、RoPE/inverse RoPE 数据流。
- `Engineering and Complexity` 重算：
  - 删除“纯 SWA-128 only”作为主对比。
  - 改成 Full MLA、local-global SWA 5:1、local-global SWA 7:1、CSA-only、HCA-only、DSV4 hybrid。
  - 分开画三类曲线：live KV cache、core attention selected entries、Indexer scan cost。
  - 明确说明自算曲线只解释 attention 子模块趋势；官方 1M context 的 `27% FLOPs / 10% KV cache` 仍以 Tech Report Figure 1 为校准点。
- 事实校正与加深：
  - 说明 `config.json` 是 HF 命名，`inference/config.json` 是 inference dataclass 命名，避免 `qk_rope_head_dim`/`rope_head_dim` 混读。
  - 明确 `self.overlap = compress_ratio == 4` 是 bool，所以 ratio=4 时 `coff=2`，不是 5。
  - 精确写出 `self.ape`：ratio=4 主 compressor `[4,1024]`，Indexer compressor `[4,256]`，ratio=128 主 compressor `[128,512]`。
  - 位置编码章节区分：APE 是压缩权重的块内位置偏置；RoPE 是压缩后 KV anchor 的绝对位置旋转。
  - `sparse_attn` 明确不是只服务 ratio=4；它服务 window-only、CSA、HCA，区别只在 `topk_idxs` 来源。
  - DSV4 技术报告若没有 CSA/HCA 消融表，不伪造 ablation；正文明确区分“Tech Report 原始性能/结构图”和“mHC/RoPER 消融证据”。

## Implementation Steps
- 先生成 `dsv4-architecture-discussion-record.md`：
  - 数据源使用本地 session JSONL：`~/.codex/sessions/2026/05/11/rollout-2026-05-11T18-36-22-019e169b-ffc1-7d01-af44-f0e514cba8e0.jsonl`。
  - 记录每个用户问题、对应助手回复、时间戳、主题标签、当前 HTML 覆盖章节。
  - 对被 compression 摘要替代或不完整的段落标注“日志可见内容为准”。
- 改写 HTML：
  - 复制博客文章样式的关键变量和布局，不引入 Astro 构建，不改 `src/`。
  - 将章节重排为：Overview、Paper Figures、Code-Grounded Architecture、Hybrid Attention、RoPE/RoPER、attn_sink vs Gated、mHC、MoE/Output Projection、Engineering Complexity、Apple-to-Apple、Q&A Coverage、References。
  - 所有关键论断加脚注式 source badge：`Paper-Fig3`、`Code-Compressor`、`Code-Kernel`、`mHC-Abla`、`RoPER-Abla`。
- 图表抽取：
  - 用 `pdftoppm/pdftotext` 在临时目录渲染/定位 PDF 页，再裁剪 Figure 1/2/3/4/6。
  - 裁剪图不单独作为依赖文件，转 base64 嵌入 HTML。
  - 对每张原图写“图里说了什么、它不能证明什么、和代码如何对应”。
- 复杂度脚本：
  - 临时脚本显式写入 DSV4 参数：61 层、30 CSA、31 HCA、`window=128`、`head_dim=512`、`index_head_dim=128`、`index_topk=1024`。
  - 输出内联 SVG 和表格；脚本不保留到仓库，除非需要复现则另行放入 `docs/`。

## Test Plan
- 静态检查：
  - HTML parse 成功。
  - 所有 `href="#..."` anchor 存在。
  - 所有 `Reference/...` 本地链接存在。
  - 无 `TODO/TBD/undefined/NaN`。
- 内容核验：
  - 用 `rg/jq` 校验配置数字、ratio count、`self.overlap`、`self.ape`、`attn_sink`、`sparse_attn`、`hc_split_sinkhorn` 等代码事实。
  - 检查 MD 覆盖矩阵里每个历史问题都有 HTML 章节映射。
  - 对 `L=1M` 的自算表做 sanity check，并与 Tech Report Figure 1 的方向一致但不冒充官方精确 FLOPs。
- 视觉验收：
  - 用可行的 headless Chrome 或静态截图路径检查 1440px 与移动窄屏。
  - 重点看目录、长公式、表格、base64 原始图、SVG 图是否溢出或重叠。
  - 若 in-app browser 仍因 `file://` 策略拒绝，最终说明该项由 headless/静态检查替代。

## Assumptions
- 继续保持目标 HTML 为单文件自包含，不接入 Astro 内容系统。
- `docs/Reference/` 已有资料继续复用，不重复下载同名论文。
- 新增 MD 是报告的审计材料，不替代 HTML 正文。
- DSV4 Tech Report 的原始图可引用和解析，但大段文字仍以转述为主，避免长篇复制。
```

**Assistant（日志可见回复）**

_timestamp: `2026-05-13T02:31:49.572Z`_

```text
我会直接执行这版改造：先把会话问答记录和 PDF 图表素材在临时区生成出来，再把新版 HTML/MD 写入 `docs`。目标目录不在当前可写 root 里，所以真正落盘到博客目录时会用一次受控授权复制。
```

_timestamp: `2026-05-13T02:32:25.348Z`_

```text
I'm using the executing-plans skill to implement this plan. 这次不需要拆 subagent，我会把风险控制在两类：原始资料抽取不能误标，复杂度图不能把简化模型说成官方数据。
```

_timestamp: `2026-05-13T02:32:53.482Z`_

```text
我已经确认 `inference/config.json` 与 HF `config.json` 的字段映射，二次版会把这个差异显式写进去。接下来我先渲染 DeepSeek-V4 和 mHC PDF 的目标页，在临时区裁出原始 Figure，避免自己重画论文已有图。
```

_timestamp: `2026-05-13T02:35:35.611Z`_

```text
我准备写一个临时生成脚本：它会读取 session JSONL 生成审计 MD，裁剪 PDF 原图并转成 base64，然后用同一套参数生成复杂度 SVG 和新版 HTML。脚本只放在 `/private/tmp`，最终只把产物复制进 `docs`。
```

_timestamp: `2026-05-13T02:42:28.988Z`_

```text
我接着把二次改版落地：先跑已经准备好的生成脚本，如果它在公式或图表嵌入上有语法问题，我会直接修到能生成 HTML 和审计 MD。
```

_timestamp: `2026-05-13T02:42:33.201Z`_

```text
脚本的第一处问题是 Python f-string 把公式里的 `{}` 当成表达式解析了，恰好卡在 `R^{64×128}` 这一类数学记号上。我会把这些公式花括号转义掉，再继续跑生成。
```

_timestamp: `2026-05-13T02:43:09.763Z`_

```text
临时版已经生成成功：一个 HTML、一个讨论审计 MD。下一步我会快速抽查它们的内容和图表嵌入，再把成品写到 blog docs 目录。
```

_timestamp: `2026-05-13T02:43:32.054Z`_

```text
抽查发现两个需要补刀的地方：覆盖矩阵里少数历史问题被关键词误分到了泛化主题，另外审计 MD 因为保留原始对话，会自然包含用户当时提到的 `coff=5` 这类“待纠正说法”。我会把矩阵映射修精确，HTML 继续保持无残留占位符。
```

_timestamp: `2026-05-13T02:43:59.980Z`_

```text
内容和映射修完后，我现在需要把两个生成文件写回 `houyi.blogs/docs`。这个目录在当前可写根之外，所以这一步会请求一次文件写入授权。
```

_timestamp: `2026-05-13T02:44:32.284Z`_

```text
现在进入验收：我会先做静态 HTML/引用/锚点检查，再核对关键代码事实和历史问题覆盖，最后用 headless Chrome 截图看桌面与窄屏排版。
```

_timestamp: `2026-05-13T02:45:51.661Z`_

```text
静态检查已经过了：12 个章节、7 张内嵌原始论文图、7 个自绘 SVG，锚点和本地 Reference 链接都存在。现在做视觉截图，重点看论文图、长表格和窄屏目录有没有挤压。
```

_timestamp: `2026-05-13T02:46:24.672Z`_

```text
桌面版看起来已经接近博客研究笔记风格；移动截图暴露了一个真问题：顶栏和正文表格在 390px 下有横向溢出，标题右侧被裁了。我会把 mobile 断点、标题换行和表格横向滚动修掉再复验。
```
