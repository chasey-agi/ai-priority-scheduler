#!/usr/bin/env python3
"""
验证 OPENAI_API_KEY 是否可用（两项能力）：
1) Chat Completions（gpt-4o-2024-08-06）
2) 语音转写 Whisper（whisper-1）

用法示例：
  python scripts/validate_openai_key.py --audio path/to/audio.wav

说明：
- 必须设置环境变量 OPENAI_API_KEY。
- 语音文件建议使用常见格式：wav/mp3/m4a/ogg/webm 等。
- 若任一能力验证失败，脚本将以非 0 退出码结束。
"""

import argparse
import json
import os
import sys
from typing import Optional

try:
    # 新版 SDK：pip install openai>=1.0.0
    from openai import OpenAI
    from openai import APIError, APIConnectionError, RateLimitError, BadRequestError, AuthenticationError
except Exception as e:  # pragma: no cover
    print("[错误] 未找到 openai SDK，请先安装：pip install --upgrade openai", file=sys.stderr)
    print(f"[详细] {e}", file=sys.stderr)
    sys.exit(1)


def fail(msg: str, code: int = 1):
    print(f"[失败] {msg}")
    sys.exit(code)


def ok(msg: str):
    print(f"[通过] {msg}")


def chat_check(client: OpenAI) -> bool:
    """验证 Chat Completions 是否可用。"""
    try:
        resp = client.chat.completions.create(
            model="gpt-5-nano-2025-08-07",
            messages=[
                {"role": "system", "content": "你是一个简洁的助手。"},
                {"role": "user", "content": "请回复一个词：OK"},
            ],
            temperature=1,
        )
        text = (resp.choices[0].message.content or "").strip()
        ok(f"Chat 正常，模型返回：{text!r}")
        return True
    except AuthenticationError as e:
        fail("鉴权失败：请检查 OPENAI_API_KEY", code=2)
    except RateLimitError as e:
        fail("达到限流/配额限制：请稍后重试或检查账户配额", code=2)
    except (BadRequestError, APIError, APIConnectionError) as e:
        fail(f"Chat API 调用失败：{type(e).__name__}: {e}", code=2)
    except Exception as e:  # 兜底
        fail(f"Chat 未知错误：{type(e).__name__}: {e}", code=2)
    return False


def transcribe_check(client: OpenAI, audio_path: str, language: Optional[str] = "zh") -> bool:
    """验证 Whisper 语音转写是否可用。"""
    if not os.path.isfile(audio_path):
        fail(f"未找到音频文件：{audio_path}", code=3)
    try:
        with open(audio_path, "rb") as f:
            resp = client.audio.transcriptions.create(
                model="gpt-4o-transcribe",
                file=f,
                language=language,
            )
        text = (getattr(resp, "text", "") or "").strip()
        if text:
            ok(f"语音转写正常，识别结果：{text!r}")
        else:
            ok("语音转写调用成功，但未返回文本（可能是静音或音频质量问题）")
        return True
    except AuthenticationError as e:
        fail("鉴权失败：请检查 OPENAI_API_KEY", code=3)
    except RateLimitError as e:
        fail("达到限流/配额限制：请稍后重试或检查账户配额", code=3)
    except BadRequestError as e:
        fail(f"请求不合法或音频格式问题：{e}", code=3)
    except (APIError, APIConnectionError) as e:
        fail(f"转写 API 调用失败：{type(e).__name__}: {e}", code=3)
    except Exception as e:
        fail(f"转写未知错误：{type(e).__name__}: {e}", code=3)
    return False


def main():
    parser = argparse.ArgumentParser(description="验证 OPENAI_API_KEY 两项能力：Chat 与 Whisper 转写")
    parser.add_argument("--audio", required=False, help="用于转写测试的音频文件路径（wav/mp3/m4a/ogg/webm 等）")
    parser.add_argument("--language", default="zh", help="音频语言（默认 zh）")
    args = parser.parse_args()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        fail("未检测到环境变量 OPENAI_API_KEY，请先设置。", code=1)

    # 与 Next.js 路由保持一致的超时与重试配置
    client = OpenAI(api_key=api_key, timeout=60.0, max_retries=2)

    print("=== 1) 校验 Chat Completions ===")
    chat_ok = chat_check(client)

    exit(0)

    print("\n=== 2) 校验 Whisper 语音转写 ===")
    whisper_ok = transcribe_check(client, args.audio, language=args.language)

    if chat_ok and whisper_ok:
        print("\n[成功] OPENAI_API_KEY 可用：Chat 与 Whisper 转写均正常。")
        sys.exit(0)
    else:
        fail("OPENAI_API_KEY 校验未全部通过（见上方错误信息）", code=4)


if __name__ == "__main__":
    main()

