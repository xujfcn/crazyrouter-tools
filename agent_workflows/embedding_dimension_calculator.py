#!/usr/bin/env python3
"""Estimate storage and rough cost tradeoffs for embedding dimensions.

This tool is intentionally simple: it helps teams reason about whether they
really need the default 1536 dimensions for text-embedding-3-small, or whether
1024 / 768 / 512 dimensions are enough for their workload.

Examples:
  python3 embedding_dimension_calculator.py --documents 1000000 --avg-tokens 350
  python3 embedding_dimension_calculator.py --documents 250000 --avg-tokens 800 --dimensions 1536 1024 512
  python3 embedding_dimension_calculator.py --documents 50000 --avg-tokens 600 --price-per-million 0.02
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass


@dataclass
class Row:
    dimensions: int
    bytes_per_vector: int
    raw_gib: float
    with_index_gib: float
    storage_delta_pct: float


def gib(n: float) -> float:
    return n / (1024 ** 3)


def fmt_money(x: float) -> str:
    if x < 0.01:
        return f"${x:.4f}"
    if x < 1:
        return f"${x:.2f}"
    return f"${x:,.2f}"


def build_rows(documents: int, dimensions: list[int], bytes_per_float: int, index_overhead: float) -> list[Row]:
    max_dim = max(dimensions)
    rows: list[Row] = []
    for dim in dimensions:
        b = documents * dim * bytes_per_float
        rows.append(
            Row(
                dimensions=dim,
                bytes_per_vector=dim * bytes_per_float,
                raw_gib=gib(b),
                with_index_gib=gib(b * (1 + index_overhead)),
                storage_delta_pct=(1 - dim / max_dim) * 100,
            )
        )
    return rows


def recommendation(documents: int, avg_tokens: int) -> str:
    if documents < 100_000 and avg_tokens < 500:
        return "Start with 1536 for quality, then test 1024 if storage or latency becomes visible."
    if documents >= 1_000_000:
        return "Benchmark 1024 and 768 early; the storage and index-size savings become meaningful at this scale."
    return "Use 1536 as the baseline, test 1024 for production, and avoid going to 512 unless retrieval quality is measured."


def main() -> None:
    parser = argparse.ArgumentParser(description="Embedding dimension storage and cost estimator")
    parser.add_argument("--documents", type=int, required=True, help="Number of text chunks / documents to embed")
    parser.add_argument("--avg-tokens", type=int, required=True, help="Average tokens per chunk")
    parser.add_argument("--dimensions", type=int, nargs="+", default=[1536, 1024, 768, 512], help="Dimensions to compare")
    parser.add_argument("--bytes-per-float", type=int, default=4, help="Float size in bytes; float32 = 4")
    parser.add_argument("--index-overhead", type=float, default=0.35, help="Rough vector DB index overhead, e.g. 0.35 = 35%%")
    parser.add_argument("--price-per-million", type=float, default=0.02, help="Embedding price per 1M input tokens; adjust for your provider")
    args = parser.parse_args()

    total_tokens = args.documents * args.avg_tokens
    embed_cost = total_tokens / 1_000_000 * args.price_per_million
    rows = build_rows(args.documents, sorted(set(args.dimensions), reverse=True), args.bytes_per_float, args.index_overhead)

    print("Embedding Dimension Calculator")
    print("=" * 32)
    print(f"Documents/chunks: {args.documents:,}")
    print(f"Average tokens/chunk: {args.avg_tokens:,}")
    print(f"Estimated input tokens: {total_tokens:,}")
    print(f"Embedding generation cost @ {fmt_money(args.price_per_million)}/1M tokens: {fmt_money(embed_cost)}")
    print()
    print("Dimension storage comparison")
    print("-" * 32)
    print(f"{'Dims':>6}  {'Bytes/vector':>12}  {'Raw GiB':>10}  {'With index GiB':>14}  {'Saved vs max':>12}")
    for r in rows:
        print(f"{r.dimensions:>6}  {r.bytes_per_vector:>12,}  {r.raw_gib:>10.2f}  {r.with_index_gib:>14.2f}  {r.storage_delta_pct:>11.0f}%")
    print()
    print("Recommendation")
    print("-" * 32)
    print(recommendation(args.documents, args.avg_tokens))
    print()
    print("Note: the embedding API cost is usually based on input tokens, not vector dimensions.")
    print("Dimensions mainly affect vector storage size, index memory, search latency, and sometimes retrieval quality.")


if __name__ == "__main__":
    main()
