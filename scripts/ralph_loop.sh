#!/bin/bash

while grep -q '\- \[ \]' PLAN.md; do
  echo "=== Running next task ==="

  # NOTE: `claude -p` defaults to --output-format=text which is *final-only* (no streaming).
  # For streaming output, use stream-json + partial messages and render deltas as they arrive.
  if command -v jq >/dev/null 2>&1; then
    # `--verbose` is required for --output-format=stream-json when using --print.
    claude -p "$(cat prompt.md)" \
      --output-format=stream-json \
      --include-partial-messages \
      --verbose \
      --dangerously-skip-permissions \
      | jq -rj 'select(.type=="stream_event" and .event.type=="content_block_delta" and .event.delta.type=="text_delta") | .event.delta.text'
    exit_code=${PIPESTATUS[0]}
    echo ""
  else
    stdbuf -oL -eL claude -p "$(cat prompt.md)" --dangerously-skip-permissions
    exit_code=$?
  fi

  # Check if claude exited with an error (could be API limit)
  if [ $exit_code -ne 0 ]; then
    echo ""
    echo "Claude exited with error (exit code: $exit_code). Waiting 15 minutes before retry..."
    for ((i=15; i>0; i--)); do
      printf "\rTime remaining: %02d:00" $i
      sleep 60
    done
    echo ""
  fi
done

echo "All tasks complete!"
