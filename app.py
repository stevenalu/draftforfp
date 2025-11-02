from flask import Flask, render_template, url_for, redirect, request, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin, login_user, LoginManager, login_required, logout_user, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import ValidationError, Length, InputRequired
from flask_bcrypt import Bcrypt


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///evura.db'
app.config['SECRET_KEY'] = 'evurasecretkey'
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'index'

@login_manager.user_loader
def load_user(user_id):
    return Users.query.get(int(user_id))

class Users(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    password = db.Column(db.String(300), nullable=False)

    def __repr__(self):
        return f'This is user {self.id}'

class Users_d(db.Model, UserMixin):
    doctor_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    password = db.Column(db.String(300), nullable=False)

    def __repr__(self):
        return f'This is user {self.doctor_id}'

    
class SignupForm(FlaskForm):
    username = StringField(validators=[InputRequired(), Length(min=6, max=30)], render_kw={"placeholder":"Username"})
    email = StringField(validators=[InputRequired(), Length(min=6, max=100)], render_kw={"placeholder":"Email"})
    password = PasswordField(validators=[InputRequired(), Length(min=6, max=30)], render_kw={"placeholder":"Password"})
    submit = SubmitField("Sign up")

    def validate_email(self, email):
        existing_user = Users.query.filter_by(email=email.data).first()
        if existing_user:
            raise ValidationError("Email already registered. Please log in instead.")


class LoginForm(FlaskForm):
    email = StringField(validators=[InputRequired(), Length(min=6, max=100)], render_kw={"placeholder":"Email"})
    password = PasswordField(validators=[InputRequired(), Length(min=6, max=30)], render_kw={"placeholder":"Password"})
    submit = SubmitField("Sign in")

@app.route('/', methods=['GET', 'POST'])
def index():
    form = SignupForm()
    login_form = LoginForm()

    # default values for initial render
    role = None
    active = None  # 'login' or 'signup'

    if request.method == 'POST':
        form_name = request.form.get('form_name')
        role = request.form.get('role')  # 'I'm a Doctor' or 'I'ma Patient'
        active = form_name  # keep the active tab equal to the form submitted

        # determine target model
        target_model = Users if role == 'patient' else Users_d

        # for Signing up
        if form_name == 'signup' and form.validate():
            existing_user = target_model.query.filter_by(email=form.email.data).first()
            if existing_user:
                flash("Email already registered. Please log in instead.", "warning")
                return redirect(url_for('index', role=role, active=form_name))

            else:
                hashed_pw = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
                new_user = target_model(username=form.username.data, email=form.email.data, password=hashed_pw)
                db.session.add(new_user)
                db.session.commit()
                login_user(new_user)
                flash(f"Account created successfully as {role.title()}! Redirecting to dashboard...", "success")
                return redirect(url_for('dashboard'))

        # for logging in
        elif form_name == 'login' and login_form.validate():
            user = target_model.query.filter_by(email=login_form.email.data).first()
            if user and bcrypt.check_password_hash(user.password, login_form.password.data):
                login_user(user)
                flash(f"Welcome {user.username}! Logged in as {role.title()}.", "success")
                return redirect(url_for('dashboard'))
            else:
                flash(f"Invalid credentials or incorrect role ({role.title()}).", "danger")
                return redirect(url_for('index', role=role, active=form_name))


    # Ensure role and active form persist on reload
    if not role:
        role = request.args.get('role', None)
    if not active:
        active = request.args.get('active', None)

    return render_template('index.html', form=form, login_form=login_form, role=role, active=active)

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True)