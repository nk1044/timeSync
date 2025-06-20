import 'package:application/pages/todo/todo_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:application/server/dio_instance.dart';
import 'package:logger/logger.dart';

final _logger = Logger();

final todosProvider = FutureProvider<List<Todo>>((ref) async {
  try {
    final dio = ref.watch(dioProvider);
    final res = await dio.get('/todos');
    final todos = (res.data['todo'] as List)
        .map((json) => Todo.fromJson(json))
        .toList();
    _logger.i('Fetched ${todos.length} todos');
    return todos;
  } catch (e) {
    _logger.e('Error fetching todos: $e');
    rethrow;
  }
});


final singleTodoProvider = FutureProvider.family<Todo, String>((ref, id) async {
  try {
    final dio = ref.watch(dioProvider);
    final res = await dio.get('/todos/$id');
    final todo = Todo.fromJson(res.data['todo']);
    _logger.i('Fetched todo with id $id');
    return todo;
  } catch (e) {
    _logger.e('Error fetching todo: $e');
    rethrow;
  }
});


final todoRepositoryProvider = Provider<TodoRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return TodoRepository(dio);
});

class TodoRepository {
  final Dio _dio;
  TodoRepository(this._dio);

  Future<List<Todo>> getAllTodos() async {
    try {
      final res = await _dio.get('/todos');
      final todos = (res.data['todo'] as List)
          .map((json) => Todo.fromJson(json))
          .toList();
      _logger.i('Fetched ${todos.length} todos from repository');
      return todos;
    } catch (e) {
      _logger.e('Error fetching all todos: $e');
      rethrow;
    }
  }

  Future<Todo> createTodo(TodoCreateRequest data) async {
    try {
      final res = await _dio.post('/todos', data: data.toJson());
      final todo = Todo.fromJson(res.data['todo']);
      _logger.i('Created todo with id ${todo.id}');
      return todo;
    } catch (e) {
      _logger.e('Error creating todo: $e');
      rethrow;
    }
  }

  Future<void> deleteTodo(String id) async {
    try {
      await _dio.delete('/todos/$id');
      _logger.i('Deleted todo with id $id');
    } catch (e) {
      _logger.e('Error deleting todo: $e');
      rethrow;
    }
  }

  Future<Todo> updateTodo(String id, TodoCreateRequest updatedData) async {
    try {
      final res = await _dio.put('/todos/$id', data: updatedData.toJson());
      final updatedTodo = Todo.fromJson(res.data['todo']);
      _logger.i('Updated todo with id $id');
      return updatedTodo;
    } catch (e) {
      _logger.e('Error updating todo: $e');
      rethrow;
    }
  }
}
