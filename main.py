from flask import Flask, render_template, redirect
from flask_cors import CORS

app = Flask(__name__)
# Buka akses CORS untuk semua domain dan semua rute (termasuk static files)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/osis')
def osis():
    return render_template('osis.html')

@app.errorhandler(404)
def error404(error):
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True)
