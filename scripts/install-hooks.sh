#!/bin/bash
#
# Install git hooks from <hubs_dir>/hooks to <hubs_dir>/.git/hooks
# If a hook already exists, it will create a backup in the <hubs_dir>.git/hooks directory so that nothing is destroyed.
#
# Instructions:
#   - Make this script executable, e.g.
#       chmod +x ./scripts/install-hooks.sh
#   - Run this script:
#       ./scripts/install-hooks.sh

dot_git_hooks=".git/hooks/"
if [[ ! -d "${dot_git_hooks}" ]];
then
    echo "Error: Could not find .git/hooks directory. ${dot_git_hooks}"
    exit 1
fi

hooks_dir="./hooks/"
if [[ ! -d "${hooks_dir}" ]];
then
    echo "Error: Could not find ./hooks directory. ${hooks_dir}"
    exit 1
fi

echo "Installing git hooks..."
for hook in $(find ${hooks_dir} -type f -exec basename {} \;);
do
  echo "  Installing ${hook} hook:"
  src_hook="${hooks_dir}${hook}"
  dest_hook="${dot_git_hooks}${hook}"
  if [[ -f "${dest_hook}" ]];
  then
      timestamp="$(date +%F_%H-%M-%S)"
      backup="${dest_hook}.backup.${timestamp}"
      echo "    Warning: ${dest_hook} already exists."
      echo "    Creating a backup so that it is not lost:"
      echo "      ${backup}"
      mv "${dest_hook}" ${backup}
  fi

  echo "    Copying ${src_hook} to ${dest_hook} ."
  cp "${src_hook}" "${dest_hook}"

  echo "    Marking ${dest_hook} as executable."
  chmod +x "${dest_hook}"
done
echo "Finished installing hooks."
