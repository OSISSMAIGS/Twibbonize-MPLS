from flask import Flask, render_template, redirect

app = Flask(__name__)

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