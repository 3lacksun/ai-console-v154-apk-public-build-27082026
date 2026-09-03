import atexit
from pathlib import Path
import runpy
import sys


def _apply_native_webview_overflow_remediation():
    script_name = Path(sys.argv[0]).name if sys.argv else ''
    if script_name != 'mobile-flow-hotfix.py':
        return
    remediation = Path(__file__).with_name('native-webview-overflow-remediation.py')
    if not remediation.is_file():
        raise SystemExit('native-webview-overflow-remediation.py is missing')
    runpy.run_path(str(remediation), run_name='__main__')


atexit.register(_apply_native_webview_overflow_remediation)
